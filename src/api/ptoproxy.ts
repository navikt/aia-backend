import { Router } from 'express';
import config from '../config';
import { proxyHttpCall as proxy } from '../http';

function ptoProxy(ptoProxyUrl = config.PTO_PROXY_URL) {
    const router = Router();
    /**
     * @openapi
     * /oppfolging:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *       401:
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
     */
    router.get('/oppfolging', proxy(`${ptoProxyUrl}/veilarboppfolging/api/oppfolging`));
    /**
     * @openapi
     * /underoppfolging:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *       401:
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
     */
    router.get('/underoppfolging', proxy(`${ptoProxyUrl}/veilarboppfolging/api/niva3/underoppfolging`));
    /**
     * @openapi
     * /dialog/antallUleste:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *       401:
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
     */
    router.get('/dialog/antallUleste', proxy(`${ptoProxyUrl}/veilarbdialog/api/dialog/antallUleste`));
    /**
     * @openapi
     * /vedtakinfo/besvarelse:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *       401:
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
     */
    router.get('/vedtakinfo/besvarelse', proxy(`${ptoProxyUrl}/veilarbvedtakinfo/api/behovsvurdering/besvarelse`));
    /**
     * @openapi
     * /vedtakinfo/motestotte:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *       401:
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
     */
    router.get('/vedtakinfo/motestotte', proxy(`${ptoProxyUrl}/veilarbvedtakinfo/api/motestotte`));

    return router;
}

export default ptoProxy;
