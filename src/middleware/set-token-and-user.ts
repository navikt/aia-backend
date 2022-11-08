import { Request, Response, NextFunction } from 'express';
import { decodeJwt } from 'jose';
import log from '../logger';
import config from '../config';

export default function setTokenAndUser(req: Request, res: Response, next: NextFunction) {
    const token = getTokenFromCookie(req);
    if (req.path.startsWith('/docs')) return next();
    if (!token) return res.status(401).end();

    res.locals.token = token;

    const subject = getSubjectFromToken(token);
    if (!subject) {
        log.error('fikk ikke hentet ident fra token');
        return res.sendStatus(401).end();
    }
    res.locals.user = subject;

    return next();
}

function getSubjectFromToken(idPortenToken: string) {
    const decodedToken = decodeJwt(idPortenToken);
    return decodedToken.sub;
}

function getTokenFromCookie(req: Request) {
    return req.cookies && req.cookies[config.NAV_COOKIE_NAME];
}

export function setTokenAndUserMock(req: Request, res: Response, next: NextFunction) {
    const token = getTokenFromCookie(req);
    if (!token) return res.status(401).end();
    res.locals.token = 'token123';
    res.locals.user = 'test-ident';
    return next();
}
