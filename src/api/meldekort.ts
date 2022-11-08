import { Request, Response, Router } from 'express';
import { Auth } from '../auth/tokenDings';
import config from '../config';
import { proxyHttpCall } from '../http';
import logger from '../logger';

function meldekortRoutes(tokenDings: Auth, meldekortUrl: string = config.MELDEKORT_URL) {
    const router = Router();
    const MELDEKORT_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:meldekort:${config.MELDEKORT_APP_NAME}`;

    const getTokenXHeaders = async (idPortenToken: string) => {
        const tokenSet = await tokenDings.exchangeIDPortenToken(idPortenToken, MELDEKORT_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: null, TokenXAuthorization: `Bearer ${token}` };
    };

    const meldekortCall = (url: string) => {
        return async (req: Request, res: Response) => {
            try {
                await proxyHttpCall(url, {
                    headers: await getTokenXHeaders(res.locals.token),
                })(req, res);
            } catch (err) {
                logger.error(`Feil med meldekort kall: ${err}`);
                res.status(500).end();
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
