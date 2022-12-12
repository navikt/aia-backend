import { Request, Response, NextFunction } from 'express';
import config from '../../src/config';

export default function (req: Request, res: Response, next: NextFunction) {
    const token = req.cookies[config.NAV_COOKIE_NAME];
    if (!token) return res.status(401).end();
    req.locals.idporten.token = 'token123';
    req.locals.idporten.user = 'test-ident';
    const acr = 'Level3';
    req.locals.idporten.isLevel3 = acr === 'Level3';

    return next();
}
