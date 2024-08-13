import { Request, Router } from 'express';

import { Auth, getTokenFromRequest } from '../auth/tokenDings';
import config from '../config';
import { proxyTokenXCall } from '../http';

export const getTokenXHeadersForDialog =
    (tokenDings: Auth, naisCluster = config.NAIS_CLUSTER_NAME) =>
    async (req: Request) => {
        const DIALOG_CLIENT_ID = `${naisCluster}:dab:veilarbdialog`;

        const idPortenToken = getTokenFromRequest(req);
        const tokenSet = await tokenDings.exchangeIDPortenToken(idPortenToken, DIALOG_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    };

function dialogRoutes(tokenDings: Auth, dialogApiUrl = config.VEILARBDIALOG_API_URL) {
    const router = Router();
    const getTokenXHeaders = getTokenXHeadersForDialog(tokenDings);
    const dialogCall = (url: string) => proxyTokenXCall(url, getTokenXHeaders);
    /**
     * @openapi
     * /dialog/antallUleste:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/dialog/antallUleste', dialogCall(`${dialogApiUrl}/dialog/antallUleste`));

    /**
     * @openapi
     * /dialog:
     *   post:
     *     description: Oppretter ny dialog i dialogløsningen
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.post('/dialog', dialogCall(`${dialogApiUrl}/dialog`));

    return router;
}

export default dialogRoutes;
