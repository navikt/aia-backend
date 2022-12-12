import { Request, Response } from 'express';
import config from './config';
import axios, { AxiosError } from 'axios';
import logger, { axiosLogError } from './logger';
import { isNetworkOrIdempotentRequestError } from './isRetryAllowed';

interface ProxyOpts {
    headers?: Record<string, string | null>;
    overrideMethod?: string;
    skipRetry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}

export function getDefaultHeaders(req: Request, res: Response) {
    const token = res.locals.token;
    return {
        'Content-Type': req.header('Content-Type') || 'application/json',
        ...(req.header('Nav-Call-Id') ? { 'Nav-Call-Id': req.header('Nav-Call-Id') } : {}),
        ...(req.header('NAV_CSRF_PROTECTION') ? { NAV_CSRF_PROTECTION: req.header('NAV_CSRF_PROTECTION') } : {}),
        [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
        Authorization: `Bearer ${token}`,
    };
}

const defaultOpts: ProxyOpts = {
    skipRetry: false,
    maxRetries: 3,
    retryDelay: 20,
};

export function proxyHttpCall(url: string, opts: ProxyOpts = defaultOpts) {
    return async (req: Request, res: Response) => {
        const method = opts?.overrideMethod || req.method;
        const defaultHeaders = getDefaultHeaders(req, res);

        const retry = async (counter: number): Promise<any> => {
            const { skipRetry, retryDelay, maxRetries } = opts;

            const shouldRetry = (err: AxiosError) => {
                return !skipRetry && counter < maxRetries! && isNetworkOrIdempotentRequestError(err);
            };

            try {
                const { data, status } = await axios(url, {
                    method,
                    data: req.method === 'POST' ? req.body : undefined,
                    params: req.params,
                    headers: {
                        ...defaultHeaders,
                        ...opts?.headers,
                    },
                    responseType: 'stream',
                });

                if (counter > 0) {
                    console.info(`Vellykket retry etter ${counter} forsøk mot: ${url}`);
                }

                if (status === 204) {
                    return res.status(status).end();
                }
                return data.pipe(res);
            } catch (err) {
                const axiosError = err as AxiosError;
                const status = axiosError.response?.status || 500;

                if (shouldRetry(axiosError)) {
                    logger.warn(`Retry kall ${counter + 1}} mot ${url}: response ${status}`);
                    return setTimeout(() => retry(counter + 1), retryDelay);
                }

                axiosLogError(axiosError);
                return res.status(status).send((err as Error).message);
            }
        };

        return retry(0);
    };
}
