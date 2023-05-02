import { Router } from 'express';
import config from '../config';
import logger, { axiosLogError } from '../logger';
import axios, { AxiosError, RawAxiosRequestHeaders } from 'axios';
import { ParsedQs } from 'qs';
import { getDefaultHeaders } from '../http';
import { Auth } from '../auth/tokenDings';
import { getTokenXHeadersForVeilarbregistrering } from './veilarbregistrering';
import { getTokenXHeadersForVeilarboppfolging } from './oppfolging';

interface Arbeidssokerperioder {
    status: number;
    arbeidssokerperioder: [{ fraOgMedDato: string; tilOgMedDato?: string | null }] | [];
}

interface UnderOppfolging {
    status: number;
    underoppfolging: boolean;
}

export async function hentArbeidssokerPerioder(
    veilarbregistreringUrl: string,
    headers: RawAxiosRequestHeaders,
    query: ParsedQs
): Promise<Arbeidssokerperioder> {
    const fraOgMed = query.fraOgMed ?? '2020-01-01';
    const tilOgMed = query.tilOgMed ?? '';
    const url = `${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/perioder/niva3?fraOgMed=${fraOgMed}${
        tilOgMed ? `&tilOgMed=${tilOgMed}` : ''
    }`;

    try {
        const { data, status } = await axios(url, {
            headers,
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
    tokenDings: Auth,
    veilarboppfolgingUrl = config.VEILARBOPPFOLGING_URL,
    veilarbregistreringUrl = config.VEILARBREGISTRERING_URL,
    naisCluster = config.NAIS_CLUSTER_NAME
) {
    const router = Router();
    const tokenXHeadersForVeilarbregistrering = getTokenXHeadersForVeilarbregistrering(tokenDings);
    const tokenXHeadersForVeilarboppfoling = getTokenXHeadersForVeilarboppfolging(tokenDings, naisCluster);
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
        const arbeidssokerperioder = await hentArbeidssokerPerioder(
            veilarbregistreringUrl,
            {
                ...getDefaultHeaders(req),
                ...(await tokenXHeadersForVeilarbregistrering(req)),
            },
            req.query
        );
        const underoppfolging = await hentUnderOppfolging({
            ...getDefaultHeaders(req),
            ...(await tokenXHeadersForVeilarboppfoling(req)),
        });

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
        const perioder = await hentArbeidssokerPerioder(
            veilarbregistreringUrl,
            {
                ...getDefaultHeaders(req),
                ...(await tokenXHeadersForVeilarbregistrering(req)),
            },
            {
                fraOgMed: '2020-01-01',
            }
        );

        const underOppfolging = await hentUnderOppfolging({
            ...getDefaultHeaders(req),
            ...(await tokenXHeadersForVeilarboppfoling(req)),
        });

        const erUnderOppfolging = underOppfolging.underoppfolging;
        const erArbeidssoker = erUnderOppfolging || perioder.arbeidssokerperioder.length > 0;
        return res.send({ erArbeidssoker });
    });

    async function hentUnderOppfolging(headers: RawAxiosRequestHeaders): Promise<UnderOppfolging> {
        try {
            const { data, status } = await axios(
                `${veilarboppfolgingUrl}/veilarboppfolging/api/niva3/underoppfolging`,
                {
                    headers,
                }
            );
            return {
                status,
                underoppfolging: Boolean(data.underOppfolging),
            };
        } catch (err: any) {
            logger.error(`Feil ved hentUnderOppfolging: ${err.message}`);
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
