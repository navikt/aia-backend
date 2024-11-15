import { Request, RequestHandler } from 'express';
import { getTokenFromRequest } from '../auth/tokenDings';
import logger, { getCustomLogProps } from '../logger';
import { decodeJwt, JWTPayload } from 'jose';
import { validateIdportenToken, validateTokenxToken } from '@navikt/oasis';

export type AuthLevel = 'Level3' | 'Level4' | 'idporten-loa-substantial' | 'idporten-loa-high';
export type ValidatedRequest = Request & { user: { level: AuthLevel; ident: string; fnr: string } };

function isTokenX(decodedToken: JWTPayload) {
    return decodedToken?.iss === process.env.TOKEN_X_ISSUER;
}

function getValidationResult(token: string, decodedToken: JWTPayload) {
    if (isTokenX(decodedToken)) {
        return validateTokenxToken(token);
    } else {
        return validateIdportenToken(token);
    }
}

const tokenValidation: RequestHandler = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        const decodedToken = decodeJwt(token);

        const validationResult = await getValidationResult(token ?? '', decodedToken);

        if (!validationResult.ok) {
            logger.warn(validationResult.error);
            res.sendStatus(401);
            return;
        }

        const payload = validationResult.payload;

        (req as ValidatedRequest).user = {
            ident: payload.sub!,
            fnr: payload.pid as string,
            level: decodedToken.acr as AuthLevel,
        };
        next();
    } catch (err: any) {
        logger.warn(getCustomLogProps(req), `Feil ved tokenx validering: ${err.message}`);
        res.sendStatus(401);
    }
};

export default tokenValidation;
