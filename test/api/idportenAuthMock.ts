import { Request, Response, NextFunction } from 'express';
import config from '../../src/config';

export default function (req: Request, res: Response, next: NextFunction) {
    const token = req.cookies && req.cookies[config.NAV_COOKIE_NAME];
    if (!token) return res.status(401).end();
    res.locals.token = token;
    res.locals.user = 'test-ident';
    const acr = 'Level3';
    res.locals.isLevel3 = acr === 'Level3';

    return next();
}
