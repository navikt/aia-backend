import { Request, Response } from 'express';
import config from './config';
import axios, { AxiosError } from 'axios';
import logger, { axiosLogError, getCustomLogProps } from './logger';
import { getTokenFromRequest } from './auth/tokenDings';
import { isNetworkOrIdempotentRequestError } from './isRetryAllowed';

interface ProxyOpts {
    headers?: Record<string, string | null>;
    overrideMethod?: string;
    skipRetry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    transformRequestBody?: (req: Request) => Promise<Record<string, string>>;
}

export function getDefaultHeaders(req: Request) {
    const token = getTokenFromRequest(req);
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
        const defaultHeaders = getDefaultHeaders(req);

        const retry = async (counter: number): Promise<any> => {
            const { skipRetry, retryDelay, maxRetries } = opts;

            const shouldRetry = (err: AxiosError) => {
                return !skipRetry && counter < maxRetries! && isNetworkOrIdempotentRequestError(err);
            };

            const getBody = async (req: Request) => {
                if (typeof opts.transformRequestBody === 'function') {
                    return opts.transformRequestBody(req);
                }

                return req.body;
            };

            try {
                const {
                    data: bodyStream,
                    status,
                    headers,
                } = await axios(url, {
                    method,
                    data: req.method === 'POST' ? await getBody(req) : undefined,
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

                res.status(status);
                res.set(headers);
                return bodyStream.pipe(res);
            } catch (err) {
                const axiosError = err as AxiosError;
                const status = axiosError.response?.status || 500;

                if (shouldRetry(axiosError)) {
                    logger.warn(`Retry kall ${counter + 1}} mot ${url}: response ${status}`);
                    return setTimeout(() => retry(counter + 1), retryDelay);
                }

                axiosLogError(axiosError, getCustomLogProps(req));
                return res.status(status).send((err as Error).message);
            }
        };

        return retry(0);
    };
}

export function proxyTokenXCall(
    url: string,
    getTokenXHeaders: (req: Request) => Promise<Record<string, string | null>>,
    opts = defaultOpts,
) {
    return async (req: Request, res: Response) => {
        try {
            await proxyHttpCall(url, {
                ...opts,
                headers: await getTokenXHeaders(req),
            })(req, res);
        } catch (err) {
            logger.error(`proxyTokenXCall error : ${(err as Error).message}`);
            const axiosError = err as AxiosError;
            const status = axiosError.response?.status || 500;
            axiosLogError(axiosError, getCustomLogProps(req));
            res.status(status).end();
        }
    };
}
