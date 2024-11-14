import type { Request } from 'express';
import logger from '../logger';
import config from '../config';
import { requestTokenxOboToken } from '@navikt/oasis';

interface TokenSet {
    access_token: string;
}
export interface ExchangeToken {
    (idPortenToken: string, targetApp: string): Promise<TokenSet>;
}

export interface Auth {
    exchangeIDPortenToken: ExchangeToken;
}

export interface TokenDingsOptions {
    tokenXWellKnownUrl: string;
    tokenXClientId: string;
    tokenXTokenEndpoint: string;
    tokenXPrivateJwk: string;
}

export function getTokenFromRequest(req: Request) {
    return getTokenFromHeader(req) || getTokenFromCookie(req);
}

function getTokenFromCookie(req: Request) {
    return req.cookies && req.cookies[config.SSO_NAV_COOKIE];
}

export function getTokenFromHeader(req: Request) {
    return req.headers.authorization?.replace('Bearer ', '');
}

const createTokenDings = async (options: TokenDingsOptions): Promise<Auth> => {
    if (process.env.NODE_ENV === 'development') {
        return {
            exchangeIDPortenToken: () => Promise.resolve({ access_token: 'token' } as TokenSet),
        };
    }

    return {
        async exchangeIDPortenToken(idPortenToken: string, targetApp: string) {
            try {
                const result = await requestTokenxOboToken(idPortenToken, targetApp);

                if (!result.ok) {
                    throw result.error;
                }

                return { access_token: result.token };
            } catch (err: unknown) {
                logger.error(`Feil under token exchange: ${err}`);
                return Promise.reject(err);
            }
        },
    };
};

export default createTokenDings;
