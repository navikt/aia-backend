import { Request, Response, Router } from 'express';
import axios, { AxiosError } from 'axios';
import { v4 } from 'uuid';

import logger, { axiosLogError } from '../logger';
import { getAzureAdToken } from '../auth/azure';
import { ValidatedRequest } from '../middleware/token-validation';
import config from '../config';

export const createVedtaksstoetteRoutes = (getAzureAdToken: (scope: string) => Promise<string>) => {
    return (scope: string, vedtaksstoetteUrl = config.VEILARBVEDTAKSSTOTTE_URL) => {
        const router = Router();

        function post(payload: any) {
            return async (req: Request, res: Response) => {
                try {
                    const azureAdToken = await getAzureAdToken(scope);

                    const correlationId = v4();
                    logger.info(
                        { x_callId: req.header('Nav-Call-Id') },
                        `Kaller vedtaksstøtte api med X-Correlation-Id=${correlationId}`,
                    );

                    const respons = await axios(`${vedtaksstoetteUrl}/veilarbvedtaksstotte/api/hent-siste-14a-vedtak`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Correlation-ID': correlationId,
                            'Nav-Call-Id': req.header('Nav-Call-Id') || null,
                            [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
                            Authorization: `Bearer ${azureAdToken}`,
                        },
                        data: payload,
                    });

                    if (respons.status === 200) {
                        respons.data ? res.json(respons.data) : res.status(204).end();
                    }
                } catch (e: any) {
                    logger.error({
                        error: e,
                        uuid: e?.response?.uuid,
                        feilmelding: e?.response?.feilmelding,
                        msg: 'Feil ved henting av siste 14a vedtak',
                    });
                    const axiosError = e as AxiosError;
                    const status = axiosError.response?.status || 500;
                    axiosLogError(axiosError);
                    res.status(status).end();
                }
            };
        }

        router.get('/vedtaksstotte/hent-siste-14a-vedtak', async (req, res) => {
            const fnr = (req as ValidatedRequest).user.fnr;

            const payload = {
                fnr: fnr,
            };

            await post(payload)(req, res);
        });

        return router;
    };
};

const vedtaksstoetteRoutes = createVedtaksstoetteRoutes(getAzureAdToken);

export default vedtaksstoetteRoutes;
