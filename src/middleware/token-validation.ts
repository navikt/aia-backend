import { Request, RequestHandler } from 'express';
import { getTokenFromRequest } from '../auth/tokenDings';
import logger, { getCustomLogProps } from '../logger';
import {
    createRemoteJWKSet,
    decodeJwt,
    FlattenedJWSInput,
    JWSHeaderParameters,
    JWTPayload,
    jwtVerify,
    KeyLike,
} from 'jose';
import config from '../config';

let tokenxJWKSet: (protectedHeader?: JWSHeaderParameters, token?: FlattenedJWSInput) => Promise<KeyLike>;
const getTokenXJwkSet = () => {
    if (!tokenxJWKSet) {
        tokenxJWKSet = createRemoteJWKSet<KeyLike>(new URL(config.TOKEN_X_JWKS_URI));
    }

    return tokenxJWKSet;
};

let idPortenJWKSet: (protectedHeader?: JWSHeaderParameters, token?: FlattenedJWSInput) => Promise<KeyLike>;
const getIdPortenJwkSet = () => {
    if (!idPortenJWKSet) {
        idPortenJWKSet = createRemoteJWKSet<KeyLike>(new URL(config.IDPORTEN_JWKS_URI!));
    }

    return idPortenJWKSet;
};

export type AuthLevel = 'Level3' | 'Level4' | 'idporten-loa-substantial' | 'idporten-loa-high';
export type ValidatedRequest = Request & { user: { level: AuthLevel; ident: string; fnr: string } };

function isTokenX(decodedToken: JWTPayload) {
    return decodedToken?.iss === process.env.TOKEN_X_ISSUER;
}

async function verifyToken(token: string, decodedToken: JWTPayload) {
    if (isTokenX(decodedToken)) {
        return await jwtVerify(token, getTokenXJwkSet(), {
            algorithms: ['RS256'],
        });
    } else {
        return await jwtVerify(token, getIdPortenJwkSet(), {
            algorithms: ['RS256'],
        });
    }
}

const tokenValidation: RequestHandler = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            logger.warn(getCustomLogProps(req), 'Bearer token mangler');
            res.sendStatus(401);
            return;
        }

        const decodedToken = decodeJwt(token);
        const result = await verifyToken(token, decodedToken);
        (req as ValidatedRequest).user = {
            ident: result.payload.sub!,
            fnr: result.payload.pid as string,
            level: decodedToken.acr as AuthLevel,
        };
        next();
    } catch (err: any) {
        logger.warn(getCustomLogProps(req), `Feil ved tokenx validering: ${err.message}`);
        res.sendStatus(401);
    }
};

export default tokenValidation;
