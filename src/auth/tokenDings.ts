import type { RequestHandler } from 'express';
import { Issuer, TokenSet } from 'openid-client';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { JWK } from 'node-jose';
import { ulid } from 'ulid';
import log from '../logger';
import config from '../config';

export interface ExchangeToken {
    (idPortenToken: string, targetApp: string): Promise<TokenSet>;
}

export interface Auth {
    exchangeIDPortenToken: ExchangeToken;
    verifyIDPortenToken: RequestHandler;
}

export interface TokenDingsOptions {
    tokenXWellKnownUrl: string;
    tokenXClientId: string;
    tokenXTokenEndpoint: string;
    tokenXPrivateJwk: string;
    idportenJwksUri: string;
    idportenClientId: string;
}

async function createClientAssertion(options: TokenDingsOptions): Promise<string> {
    const { tokenXPrivateJwk, tokenXClientId, tokenXTokenEndpoint } = options;

    const now = Math.floor(Date.now() / 1000);
    const key = await JWK.asKey(tokenXPrivateJwk);
    return jwt.sign(
        {
            sub: tokenXClientId,
            aud: tokenXTokenEndpoint,
            iss: tokenXClientId,
            exp: now + 60, // max 120
            iat: now,
            jti: ulid(),
            nbf: now,
        },
        key.toPEM(true),
        { algorithm: 'RS256' }
    );
}

const createTokenDings = async (options: TokenDingsOptions): Promise<Auth> => {
    const { tokenXWellKnownUrl, tokenXClientId, idportenClientId, idportenJwksUri } = options;
    const tokenXIssuer = await Issuer.discover(tokenXWellKnownUrl);
    const tokenXClient = new tokenXIssuer.Client({
        client_id: tokenXClientId,
        token_endpoint_auth_method: 'none',
    });

    const idPortenJWKSet = createRemoteJWKSet(new URL(idportenJwksUri));

    const noAuthRoutes = ['internal', 'docs', 'unleash'];

    return {
        async verifyIDPortenToken(req, res, next) {
            if (noAuthRoutes.some((route) => req.path.startsWith(`/${route}/`))) {
                next();
                return;
            }
            try {
                const idPortenToken = req.cookies && req.cookies[config.NAV_COOKIE_NAME];
                if (!idPortenToken) {
                    log.warn('Bearer token mangler');
                    res.sendStatus(401);
                    return;
                }
                const result = await jwtVerify(idPortenToken, idPortenJWKSet, {
                    algorithms: ['RS256'],
                });
                if (result.payload.client_id !== idportenClientId) {
                    log.warn(`client_id er ikke riktig, payload.client_id: ${result.payload.client_id}`);
                    res.sendStatus(401);
                    return;
                }
                if (result.payload.acr !== 'Level4') {
                    log.warn(`acr er ikke riktig, payload.acr: ${result.payload.acr}`);
                    res.sendStatus(403);
                    return;
                }

                next();
            } catch (err: unknown) {
                log.error(`Verifisering av token feilet: ${err}`);
                res.sendStatus(401);
            }
        },
        async exchangeIDPortenToken(idPortenToken: string, targetApp: string) {
            const clientAssertion = await createClientAssertion(options);

            try {
                return tokenXClient.grant({
                    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
                    audience: targetApp,
                    client_assertion: clientAssertion,
                    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                    subject_token: idPortenToken,
                    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
                    token_endpoint_auth_method: 'private_key_jwt',
                });
            } catch (err: unknown) {
                log.error(`Feil under token exchange: ${err}`);
                return Promise.reject(err);
            }
        },
    };
};

export default createTokenDings;