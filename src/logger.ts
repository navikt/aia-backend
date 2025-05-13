import pino from 'pino';
import { pinoHttp } from 'pino-http';
import ecsFormat from '@elastic/ecs-pino-format';
import { IncomingMessage, ServerResponse } from 'http';
import Config from './config';
import { AxiosError } from 'axios';

const logger = pino({
    redact: {
        paths: ['req.headers', 'res.headers', 'selvbetjening_idtoken'],
    },
    ...ecsFormat({ apmIntegration: false }),
    formatters: {
        level: (label: string) => ({ level: label }),
    },
});

export function customRequestLogMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method} ${req.url} completed ${res.statusCode} ${res.statusMessage}`;
}

export function getLogLevel(statusCode: number, err?: Error): pino.Level {
    if (statusCode === 401 || statusCode === 403) return 'warn';
    if (statusCode >= 400 || err) return 'error';
    return 'info';
}

export function getCustomLogProps(req: IncomingMessage) {
    return {
        x_callId: req.headers['nav-call-id'],
        x_consumerId: req.headers[Config.CONSUMER_ID_HEADER_NAME],
    };
}

export function pinoHttpMiddleware() {
    return pinoHttp({
        autoLogging: {
            ignore: (req) => (req.url ? /internal/.test(req.url) : false),
        },
        customLogLevel: (_, res, err) => getLogLevel(res.statusCode, err),
        logger,
        customSuccessMessage: customRequestLogMessage,
        customErrorMessage: customRequestLogMessage,
        customErrorObject: (req, res, error, val = {}) => {
            return {
                ...val,
                x_callId: req.headers['nav-call-id'],
                x_consumerId: req.headers[Config.CONSUMER_ID_HEADER_NAME],
            };
        },
        customProps: getCustomLogProps,
    });
}

export function axiosLogError(err: AxiosError, props: any = {}) {
    const status = err.response?.status || 500;
    const logLevel = getLogLevel(status);
    const method = err.request?.method || 'Unknown method';
    const url = err.config?.url || 'unknown URL';
    const statusText = err.response?.statusText || '';
    const data = err.response?.data;
    logger[logLevel]({ ...props, data }, `${method} ${url}: ${status} ${statusText}`);
}

export default logger;
