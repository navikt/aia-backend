import { RawAxiosRequestHeaders } from 'axios';
import { Request } from 'express';
import config from '../config';

export function getDefaultHeaders(req: Request): RawAxiosRequestHeaders {
    return {
        'Content-Type': req.header('Content-Type') || 'application/json',
        [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
        'nav-call-id': req.header('nav-call-id'),
        ...(req.header('NAV_CSRF_PROTECTION') ? { NAV_CSRF_PROTECTION: req.header('NAV_CSRF_PROTECTION') } : {}),
    };
}
