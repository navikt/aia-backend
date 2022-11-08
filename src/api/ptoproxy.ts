import { Router } from 'express';
import config from '../config';
import { proxyHttpCall } from '../http';

function ptoProxy(ptoProxyUrl = config.PTO_PROXY_URL) {
    const router = Router();
    /**
     * @openapi
     * /oppfolging:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/oppfolging', proxyHttpCall(`${ptoProxyUrl}/veilarboppfolging/api/oppfolging`));

    /**
     * @openapi
     * /underoppfolging:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/underoppfolging', proxyHttpCall(`${ptoProxyUrl}/veilarboppfolging/api/niva3/underoppfolging`));

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
    router.get('/dialog/antallUleste', proxyHttpCall(`${ptoProxyUrl}/veilarbdialog/api/dialog/antallUleste`));

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
    router.post('/dialog', proxyHttpCall(`${ptoProxyUrl}/veilarbdialog/api/dialog`));

    /**
     * @openapi
     * /vedtakinfo/besvarelse:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */

    router.get(
        '/vedtakinfo/besvarelse',
        proxyHttpCall(`${ptoProxyUrl}/veilarbvedtakinfo/api/behovsvurdering/besvarelse`)
    );

    /**
     * @openapi
     * /vedtakinfo/motestotte:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         $ref: '#/components/schemas/Ok'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/vedtakinfo/motestotte', proxyHttpCall(`${ptoProxyUrl}/veilarbvedtakinfo/api/motestotte`));

    return router;
}

export default ptoProxy;
