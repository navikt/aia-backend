import { Router } from 'express';
import config from '../config';
import { axiosLogError } from '../logger';
import axios, { AxiosError } from 'axios';
import { ParsedQs } from 'qs';
import { getTokenFromCookie } from '../auth/tokenDings';

interface Arbeidssokerperioder {
    status: number;
    arbeidssokerperioder: [{ fraOgMedDato: string; tilOgMedDato?: string | null }] | [];
}

interface UnderOppfolging {
    status: number;
    underoppfolging: boolean;
}

export async function hentArbeidssokerPerioder(
    veilarbregistreringGcpUrl: string,
    token: string,
    query: ParsedQs
): Promise<Arbeidssokerperioder> {
    const fraOgMed = query.fraOgMed;
    const tilOgMed = query.tilOgMed;
    const url = `${veilarbregistreringGcpUrl}/veilarbregistrering/api/arbeidssoker/perioder/niva3?fraOgMed=${fraOgMed}${
        tilOgMed ? `&tilOgMed=${tilOgMed}` : ''
    }`;

    try {
        const { data, status } = await axios(url, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
            },
        });
        return {
            status,
            ...data,
        };
    } catch (err) {
        const axiosError = err as AxiosError;
        const status = axiosError.response?.status || 500;
        axiosLogError(axiosError);
        return {
            status,
            arbeidssokerperioder: [],
        };
    }
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
        const token = getTokenFromCookie(req);

        if (!token) {
            return res.status(401).end();
        }

        const arbeidssokerperioder = await hentArbeidssokerPerioder(veilarbregistreringGcpUrl, token, req.query);
        const underoppfolging = await hentUnderOppfolging(token);

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
        const token = getTokenFromCookie(req);

        if (!token) {
            return res.status(401).end();
        }

        const perioder = await hentArbeidssokerPerioder(veilarbregistreringGcpUrl, token, { fraOgMed: '2020-01-01' });
        const underOppfolging = await hentUnderOppfolging(token);
        const erUnderOppfolging = underOppfolging.underoppfolging;
        const erArbeidssoker = erUnderOppfolging || perioder.arbeidssokerperioder.length > 0;
        return res.send({ erArbeidssoker });
    });

    async function hentUnderOppfolging(token: string): Promise<UnderOppfolging> {
        try {
            const { data, status } = await axios(`${ptoProxyUrl}/veilarboppfolging/api/niva3/underoppfolging`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
                },
            });
            return {
                status,
                underoppfolging: Boolean(data.underOppfolging),
            };
        } catch (err) {
            const axiosError = err as AxiosError;
            const status = axiosError.response?.status || 500;
            axiosLogError(axiosError);
            return {
                status,
                underoppfolging: false,
            };
        }
    }
    return router;
}

export default arbeidssokerRoutes;
