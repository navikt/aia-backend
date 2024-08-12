import { getDefaultHeaders, proxyTokenXCall } from '../http';
import config from '../config';
import { Request, Router } from 'express';
import { Auth, getTokenFromRequest } from '../auth/tokenDings';
import logger, { axiosLogError, getCustomLogProps } from '../logger';
import { ValidatedRequest } from '../middleware/token-validation';
import axios, { AxiosError } from 'axios';

export const getTokenXHeadersForVeilarbregistrering = (tokenDings: Auth) => async (req: Request) => {
    const VEILARBREGISTRERING_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:veilarbregistrering`;
    const incomingToken = getTokenFromRequest(req);
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, VEILARBREGISTRERING_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    } catch (e: any) {
        logger.error(`Feil ved token-utveksling for veilarbregistrering: ${e.message}`);
        throw e;
    }
};
function veilarbregistrering(tokenDings: Auth, veilarbregistreringUrl = config.VEILARBREGISTRERING_URL): Router {
    const router = Router();
    const getTokenXHeaders = getTokenXHeadersForVeilarbregistrering(tokenDings);

    /**
     * @openapi
     * /fullfoerreaktivering:
     *   post:
     *     description: Gjennomfører enkel reaktivering av en bruker.
     *     responses:
     *       204: Bruker er reaktivert
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.post(
        '/fullfoerreaktivering',
        proxyTokenXCall(`${veilarbregistreringUrl}/veilarbregistrering/api/fullfoerreaktivering`, getTokenXHeaders),
    );

    /**
     * @openapi
     * /kan-reaktiveres:
     *   post:
     *     description: Sjekker om bruker kan reaktiveres.
     *     responses:
     *       200:
     *          $ref: '#/components/schemas/KanReaktiveresDto'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/kan-reaktiveres', async (req, res) => {
        try {
            const fnr = (req as ValidatedRequest).user.fnr;
            const {
                data: bodyStream,
                status,
                headers,
            } = await axios(`${veilarbregistreringUrl}/veilarbregistrering/api/kan-reaktiveres`, {
                method: 'POST',
                data: { fnr },
                headers: {
                    ...getDefaultHeaders(req),
                    ...(await getTokenXHeaders(req)),
                },
                responseType: 'stream',
            });

            res.status(status);
            res.set(headers);
            return bodyStream.pipe(res);
        } catch (err) {
            const axiosError = err as AxiosError;
            const status = axiosError.response?.status || 500;
            axiosLogError(axiosError, getCustomLogProps(req));
            return res.status(status).send((err as Error).message);
        }
    });
    /**
     * @openapi
     * /standard-innsats:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               type: boolean
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/standard-innsats',
        proxyTokenXCall(
            `${veilarbregistreringUrl}/veilarbregistrering/api/profilering/standard-innsats`,
            getTokenXHeaders,
        ),
    );

    /**
     * @openapi
     * /arbeidssoker/perioder:
     *   get:
     *     parameters:
     *       - in: query
     *         name: fraOgMed
     *         required: true
     *         format: date
     *         type: string
     *         description: Dato YYYY-MM-DD
     *       - in: query
     *         name: tilOgMed
     *         required: false
     *         format: date
     *         type: string
     *         description: Dato YYYY-MM-DD
     *     description: Henter alle perioder hvor bruker er registrert som arbeidssøker.
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ArbeidssokerperioderDto'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/arbeidssoker/perioder',
        proxyTokenXCall(`${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/perioder`, getTokenXHeaders, {
            overrideMethod: 'POST',
        }),
    );

    /**
     * @openapi
     * /meldeplikt/siste:
     *   get:
     *     description: Henter siste meldekort for bruker.
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MeldekortDto'
     *       204:
     *         description: Ingen meldekort funnet.
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/meldeplikt/siste',
        proxyTokenXCall(
            `${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/meldekort/siste`,
            getTokenXHeaders,
        ),
    );
    /**
     * @openapi
     * /meldeplikt:
     *   get:
     *     description: Henter meldekortliste for bruker.
     *     responses:
     *       200:
     *         content:
     *          application/json:
     *             schema:
     *               $ref: '#/components/schemas/MeldekortDtoListe'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/meldeplikt',
        proxyTokenXCall(`${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/meldekort`, getTokenXHeaders),
    );
    return router;
}

export default veilarbregistrering;
