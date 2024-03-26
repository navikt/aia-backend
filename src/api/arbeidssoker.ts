import { Request, Router } from 'express';
import config from '../config';
import logger, { axiosLogError, getCustomLogProps } from '../logger';
import axios, { AxiosError, RawAxiosRequestHeaders } from 'axios';
import { ParsedQs } from 'qs';
import { getDefaultHeaders } from '../http';
import { Auth, getTokenFromRequest } from '../auth/tokenDings';
import { getTokenXHeadersForVeilarbregistrering } from './veilarbregistrering';
import { Periode } from './data/dagpengerStatus/beregnArbeidssokerPerioder';
import { plussDager } from '../lib/date-utils';
import { ValidatedRequest } from '../middleware/token-validation';
import nivaa4Authentication from '../middleware/nivaa4-authentication';
import { getTokenXHeardersForArbeidssokerregisteret } from './arbeidssokerregisteret/oppslag';
import { isEnabled } from 'unleash-client';

interface Arbeidssokerperioder {
    status: number;
    arbeidssokerperioder: [{ fraOgMedDato: string; tilOgMedDato?: string | null }] | [];
}

interface UnderOppfolging {
    status: number;
    underoppfolging: boolean;
}

export const getTokenXHeadersForVeilarboppfolging =
    (tokenDings: Auth, naisCluster = config.NAIS_CLUSTER_NAME) =>
    async (req: Request) => {
        const incomingToken = getTokenFromRequest(req);
        const VEILARBOPPFOLGING_CLIENT_ID = `${naisCluster.replace('gcp', 'fss')}:pto:veilarboppfolging`;
        try {
            const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, VEILARBOPPFOLGING_CLIENT_ID);
            const token = tokenSet.access_token;
            return { Authorization: `Bearer ${token}` };
        } catch (e: any) {
            logger.error(getCustomLogProps(req), `Feil ved token-utveksling for veilarboppfolging: ${e.message}`);
            throw e;
        }
    };
export async function hentArbeidssokerPerioder(
    veilarbregistreringUrl: string,
    headers: RawAxiosRequestHeaders,
    query: ParsedQs,
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

async function hentErStandardInnsats(
    veilarbregistreringUrl: string,
    headers: RawAxiosRequestHeaders,
): Promise<boolean> {
    const url = `${veilarbregistreringUrl}/veilarbregistrering/api/profilering/standard-innsats`;

    try {
        const { data } = await axios(url, {
            headers,
        });
        return data;
    } catch (err) {
        const axiosError = err as AxiosError;
        axiosLogError(axiosError);
        return false;
    }
}

export function filtrerUtGamleArbeidssokerPerioder(perioder: Periode[]) {
    const cutOffDato = plussDager(new Date(), -30);
    return perioder.filter((periode) => {
        return periode.tilOgMedDato ? new Date(periode.tilOgMedDato) > cutOffDato : true;
    });
}
function arbeidssokerRoutes(
    tokenDings: Auth,
    veilarboppfolgingUrl = config.VEILARBOPPFOLGING_URL,
    veilarbregistreringUrl = config.VEILARBREGISTRERING_URL,
    naisCluster = config.NAIS_CLUSTER_NAME,
    arbeidssokerregisteretApiUrl = config.ARBEIDSSOKERREGISTERET_OPPSLAG_API_URL,
) {
    const router = Router();
    const tokenXHeadersForVeilarbregistrering = getTokenXHeadersForVeilarbregistrering(tokenDings);
    const tokenXHeadersForVeilarboppfoling = getTokenXHeadersForVeilarboppfolging(tokenDings, naisCluster);
    const tokenXHeadersForArbeidssokerregisteret = getTokenXHeardersForArbeidssokerregisteret(tokenDings);
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
    router.get('/arbeidssoker', nivaa4Authentication, async (req, res) => {
        const arbeidssokerperioder = await hentArbeidssokerPerioder(
            veilarbregistreringUrl,
            {
                ...getDefaultHeaders(req),
                ...(await tokenXHeadersForVeilarbregistrering(req)),
            },
            req.query,
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
        const authLevel = (req as ValidatedRequest).user?.level;

        if (!['Level4', 'idporten-loa-high'].includes(authLevel!)) {
            return res.send({ erArbeidssoker: false, erStandard: false, brukNyAia: false });
        }

        if (isEnabled('aia.bruk-opplysninger-om-arbeidssoker-api')) {
            return res.send(
                await hentFraArbeidssokerregisteret({
                    ...getDefaultHeaders(req),
                    ...(await tokenXHeadersForArbeidssokerregisteret(req)),
                }),
            );
        }

        const veilarbregistreringHeaders = {
            ...getDefaultHeaders(req),
            ...(await tokenXHeadersForVeilarbregistrering(req)),
        };

        const [perioder, underOppfolging, erStandard] = await Promise.all([
            hentArbeidssokerPerioder(veilarbregistreringUrl, veilarbregistreringHeaders, {
                fraOgMed: '2020-01-01',
            }),
            hentUnderOppfolging({
                ...getDefaultHeaders(req),
                ...(await tokenXHeadersForVeilarboppfoling(req)),
            }),
            hentErStandardInnsats(veilarbregistreringUrl, veilarbregistreringHeaders),
        ]);

        const erUnderOppfolging = underOppfolging.underoppfolging;
        const harRelevantePerioder = filtrerUtGamleArbeidssokerPerioder(perioder.arbeidssokerperioder).length > 0;
        const erArbeidssoker = erUnderOppfolging || harRelevantePerioder;

        return res.send({ erArbeidssoker, erStandard, brukNyAia: false });
    });

    async function hentFraArbeidssokerregisteret(headers: RawAxiosRequestHeaders) {
        try {
            const { data: perioder } = await axios(`${arbeidssokerregisteretApiUrl}/api/v1/arbeidssoekerperioder`, {
                headers,
            });

            return {
                erArbeidssoker: perioder?.length > 0,
                erStandard: true,
                brukNyAia: true,
            };
        } catch (e) {
            axiosLogError(e as AxiosError);
            return {
                erArbeidssoker: false,
                erStandard: false,
                brukNyAia: true,
            };
        }
    }

    async function hentUnderOppfolging(headers: RawAxiosRequestHeaders): Promise<UnderOppfolging> {
        try {
            const { data, status } = await axios(
                `${veilarboppfolgingUrl}/veilarboppfolging/api/niva3/underoppfolging`,
                {
                    headers,
                },
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
