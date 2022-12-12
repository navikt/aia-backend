import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import log from '../logger';
import config from '../config';

export default async function idportenAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies[config.NAV_COOKIE_NAME];
    if (!token) {
        return res.status(401).end();
    }

    req.locals.idporten.token = token;

    const idPortenJWKSet = createRemoteJWKSet(new URL(config.IDPORTEN_JWKS_URI));

    const decodedToken = await jwtVerify(token, idPortenJWKSet, {
        algorithms: ['RS256'],
    });

    // Henter bruker (subject) fra token
    const subject = decodedToken.payload.sub;

    if (!subject) {
        log.error('fikk ikke hentet ident fra token');
        return res.sendStatus(401).end();
    }
    req.locals.idporten.user = subject;

    req.locals.idporten.isLevel3 = decodedToken.payload.acr === 'Level3';

    return next();
}
