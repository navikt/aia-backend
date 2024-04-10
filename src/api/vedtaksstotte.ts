import { Request, Router } from 'express';

import { Auth, getTokenFromRequest } from '../auth/tokenDings';
import config from '../config';
import { proxyTokenXCall } from '../http';

function vedtaksstoette(tokenDings: Auth, veilarbvedtaksstoetteUrl = config.VEILARBVEDTAKSSTOTTE_URL) {
    const router = Router();
    const VEILARBVEDTAKSSTOTTE_CLIENT_ID = `${config.NAIS_CLUSTER_NAME.replace('gcp', 'fss')}:pto:veilarbvedtaksstotte`;

    const getTokenXHeaders = async (req: Request) => {
        const incomingToken = getTokenFromRequest(req);
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, VEILARBVEDTAKSSTOTTE_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    };

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
    router.get(
        '/vedtaksstotte/hent-siste-14a-vedtak',
        proxyTokenXCall(
            `${veilarbvedtaksstoetteUrl}/veilarbvedtaksstotte/api/v2/hent-siste-14a-vedtak`,
            getTokenXHeaders,
        ),
    );

    return router;
}

export default vedtaksstoette;
