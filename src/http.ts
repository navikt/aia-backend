import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import log from './logger';
import { getDefaultHeaders } from './utils';

interface ProxyOpts {
    headers?: Record<string, string | null>;
    overrideMethod?: string;
}

export function proxyHttpCall(url: string, opts?: ProxyOpts) {
    return async (req: Request, res: Response) => {
        const method = opts?.overrideMethod || req.method;

        try {
            const { data, status } = await axios(url, {
                method,
                data: req.method === 'POST' ? req.body : undefined,
                params: req.params,
                headers: {
                    Authorization: `Bearer ${res.locals.token}`,
                    ...getDefaultHeaders(req),
                    ...opts?.headers,
                },
                responseType: 'stream',
            });

            if (status === 204) {
                return res.status(status).end();
            }

            return data.pipe(res);
        } catch (err) {
            const e = err as AxiosError;
            const status = e.response?.status || 500;
            log.error(`${method} ${url}: ${status} ${e.response?.statusText}`);
            return res.status(status).send((err as Error).message);
        }
    };
}
