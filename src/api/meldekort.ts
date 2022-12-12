import { Auth } from '../auth/tokenDings';
import config from '../config';
import { Request, Response, Router } from 'express';
import { proxyHttpCall } from '../http';
import { axiosLogError } from '../logger';
import { AxiosError } from 'axios';

function meldekortRoutes(tokenDings: Auth, meldekortUrl: string = config.MELDEKORT_URL) {
    const router = Router();
    const MELDEKORT_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:meldekort:${config.MELDEKORT_APP_NAME}`;

    const getTokenXHeaders = async (req: Request) => {
        const idPortenToken = req.locals.idporten.token;
        const tokenSet = await tokenDings.exchangeIDPortenToken(idPortenToken, MELDEKORT_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: null, TokenXAuthorization: `Bearer ${token}` };
    };

    const meldekortCall = (url: string) => {
        return async (req: Request, res: Response) => {
            try {
                await proxyHttpCall(url, {
                    headers: await getTokenXHeaders(req),
                })(req, res);
            } catch (err) {
                const axiosError = err as AxiosError;
                const status = axiosError.response?.status || 500;
                axiosLogError(axiosError);
                res.status(status).end();
            }
        };
    };

    /**
     * @openapi
     * /meldekort:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Person'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/meldekort', meldekortCall(`${meldekortUrl}/meldekort`));

    /**
     * @openapi
     * /meldekort/status:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PersonStatus'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/meldekort/status', meldekortCall(`${meldekortUrl}/meldekortstatus`));

    return router;
}

export default meldekortRoutes;
