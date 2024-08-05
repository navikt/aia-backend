import { Request, Router } from 'express';
import { initialize, isEnabled } from 'unleash-client';
import config from '../config';
import logger from '../logger';

try {
    initialize({
        appName: 'aia-backend',
        url: config.UNLEASH_SERVER_API_URL || process.env.UNLEASH_SERVER_API_URL!,
        customHeaders: {
            Authorization: config.UNLEASH_SERVER_API_TOKEN,
        },
    });
} catch (err) {
    logger.error({ err, msg: 'Feil i initialize' });
}

function ensureArray(features?: string | Array<string>) {
    if (!features) {
        return [];
    }

    if (Array.isArray(features)) {
        return features;
    }

    return [features];
}

type FeatureQuery = {
    feature: string;
};

function unleashRoutes() {
    const router = Router();
    router.get('/unleash', (req: Request<any, any, any, FeatureQuery>, res) => {
        const features = ensureArray(req.query.feature).reduce((acc, key) => {
            const k = encodeURIComponent(key);
            return {
                ...acc,
                [k]: isEnabled(key),
            };
        }, {});

        res.send(features);
    });

    return router;
}

export default unleashRoutes;
