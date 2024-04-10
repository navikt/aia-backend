import { Request, Router } from 'express';
import { v4 } from 'uuid';
import axios, { AxiosError } from 'axios';

import { Auth, getTokenFromRequest } from '../auth/tokenDings';
import config from '../config';
import { ValidatedRequest } from '../middleware/token-validation';
import logger, { axiosLogError } from '../logger';

async function getTokenXToken(tokenDings: Auth, req: Request) {
    const incomingToken = getTokenFromRequest(req);
    const VEILARBVEDTAKSSTOTTE_CLIENT_ID = `${config.NAIS_CLUSTER_NAME.replace('gcp', 'fss')}:pto:veilarbvedtaksstotte`;
    const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, VEILARBVEDTAKSSTOTTE_CLIENT_ID);
    const token = tokenSet.access_token;
    return token;
}

function vedtaksstoette(tokenDings: Auth, veilarbvedtaksstoetteUrl = config.VEILARBVEDTAKSSTOTTE_URL) {
    const router = Router();

    /**
     * @openapi
     * /vedtaksstotte/hent-siste-14a-vedtak:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/vedtaksstotte/hent-siste-14a-vedtak', async (req, res) => {
        const fnr = (req as ValidatedRequest).user.fnr;
        const payload = {
            fnr,
        };

        try {
            const tokenXToken = await getTokenXToken(tokenDings, req);

            const correlationId = v4();
            logger.info(
                { x_callId: req.header('Nav-Call-Id') },
                `Kaller vedtaksstøtte api med X-Correlation-Id=${correlationId}`,
            );

            await axios(`${veilarbvedtaksstoetteUrl}/veilarbvedtaksstotte/api/v2/hent-siste-14a-vedtak`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': correlationId,
                    'Nav-Call-Id': req.header('Nav-Call-Id') || null,
                    [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
                    Authorization: `Bearer ${tokenXToken}`,
                },
                data: payload,
            });

            res.status(201).end();
        } catch (e: any) {
            logger.error({
                error: e,
                uuid: e?.response?.uuid,
                feilmelding: e?.response?.feilmelding,
                msg: 'Feil ved henting av siste vedtak',
            });
            const axiosError = e as AxiosError;
            const status = axiosError.response?.status || 500;
            axiosLogError(axiosError);
            res.status(status).end();
        }
    });

    return router;
}

export default vedtaksstoette;
