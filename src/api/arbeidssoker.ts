import { Router } from 'express';
import config from '../config';
import log from '../logger';
import axios, { AxiosError, RawAxiosRequestHeaders } from 'axios';
import { ParsedQs } from 'qs';
import { getDefaultHeaders } from '../utils';

interface Arbeidssokerperioder {
    status: number;
    arbeidssokerperioder: [{ fraOgMed: string; tilOgMed?: string }?];
}

interface UnderOppfolging {
    status: number;
    underoppfolging: boolean;
}

function arbeidssokerRoutes(
    ptoProxyUrl = config.PTO_PROXY_URL,
    veilarbregistreringGcpUrl = config.VEILARBREGISTRERING_GCP_URL
) {
    const router = Router();

    /**
     * @openapi
     * /arbeidssoker:
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
     *         format: date
     *         type: string
     *         description: Dato YYYY-MM-DD
     *     description:
     *     responses:
     *       200:
     *         description: Vellykket forespørsel
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Arbeidssokerperioder'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     * components:
     *   schemas:
     *     Arbeidssokerperioder:
     *       type: object
     *       properties:
     *         arbeidssokerperioder:
     *           type: array
     *           items:
     *             type: object
     *             properties:
     *               fraOgMedDato:
     *                 type: string
     *                 example: 2020-01-01
     *               tilOgMedDato:
     *                 type: string
     *                 example: 2021-01-01
     *         underoppfolging:
     *           type: boolean
     */
    router.get('/arbeidssoker', async (req, res) => {
        const defaultHeaders = getDefaultHeaders(req);

        const arbeidssokerperioder = await hentArbeidssokerPerioder(res.locals.token, req.query, defaultHeaders);
        const underoppfolging = await hentUnderOppfolging(res.locals.token, defaultHeaders);

        return res.send({
            underoppfolging,
            arbeidssokerperioder,
        });
    });

    /**
     * @openapi
     * /er-arbeidssoker:
     *   get:
     *     parameters:
     *     description: Henter alle perioder hvor bruker er registrert som arbeidssøker.
     *     responses:
     *       200:
     *         description: Vellykket forespørsel
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 erArbeidssoker:
     *                   type: boolean
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/er-arbeidssoker', async (req, res) => {
        const defaultHeaders = getDefaultHeaders(req);

        const perioder = await hentArbeidssokerPerioder(res.locals.token, { fraOgMed: '2020-01-01' }, defaultHeaders);
        const underOppfolging = await hentUnderOppfolging(res.locals.token, defaultHeaders);
        const erUnderOppfolging = underOppfolging.underoppfolging;
        const erArbeidssoker = erUnderOppfolging || perioder.arbeidssokerperioder.length > 0;
        return res.send({ erArbeidssoker });
    });

    async function hentArbeidssokerPerioder(
        token: string,
        query: ParsedQs,
        defaultHeaders: RawAxiosRequestHeaders
    ): Promise<Arbeidssokerperioder> {
        const fraOgMed = query.fraOgMed;
        const tilOgMed = query.tilOgMed;
        const url = `${veilarbregistreringGcpUrl}/veilarbregistrering/api/arbeidssoker/perioder/niva3?fraOgMed=${fraOgMed}${
            tilOgMed ? `&tilOgMed=${tilOgMed}` : ''
        }`;

        try {
            const { data, status } = await axios(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...defaultHeaders,
                },
            });
            return {
                status,
                ...data,
            };
        } catch (err) {
            log.error(err);
            return {
                status: (err as AxiosError).response?.status || 500,
                arbeidssokerperioder: [],
            };
        }
    }

    async function hentUnderOppfolging(
        token: string,
        defaultHeaders: RawAxiosRequestHeaders
    ): Promise<UnderOppfolging> {
        try {
            const { data, status } = await axios(`${ptoProxyUrl}/veilarboppfolging/api/niva3/underoppfolging`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...defaultHeaders,
                },
            });
            return {
                status,
                underoppfolging: Boolean(data.underOppfolging),
            };
        } catch (err) {
            log.error(err);
            return {
                status: (err as AxiosError).response?.status || 500,
                underoppfolging: false,
            };
        }
    }
    return router;
}

export default arbeidssokerRoutes;
