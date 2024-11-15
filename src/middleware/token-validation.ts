import { Request, RequestHandler } from 'express';
import { getTokenFromRequest } from '../auth/tokenDings';
import logger, { getCustomLogProps } from '../logger';
import { decodeJwt } from 'jose';
import { validateIdportenToken } from '@navikt/oasis';

export type AuthLevel = 'Level3' | 'Level4' | 'idporten-loa-substantial' | 'idporten-loa-high';
export type ValidatedRequest = Request & { user: { level: AuthLevel; ident: string; fnr: string } };

const tokenValidation: RequestHandler = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        const validationResult = await validateIdportenToken(token);

        if (!validationResult.ok) {
            logger.warn(validationResult.error);
            res.sendStatus(401);
            return;
        }

        const decodedToken = decodeJwt(token);
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
