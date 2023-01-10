import { Router } from 'express';
import config from '../../../config';
import axios, { AxiosError } from 'axios';
import { hentArbeidssokerPerioder } from '../../arbeidssoker';
import { Auth, getTokenFromCookie } from '../../../auth/tokenDings';
import beregnDagpengeStatus from './beregnDagpengeStatus';
import beregnArbeidssokerperioder from './beregnArbeidssokerPerioder';
import logger, { axiosLogError } from '../../../logger';
import beregnAntallDagerSidenDagpengerStanset from './beregnAntallDagerSidenDagpengerStanset';
import { getDefaultHeaders } from '../../../http';

function dagpengerStatus(
    tokenDings: Auth,
    dagpengerInnsynUrl = config.DAGPENGER_INNSYN_URL,
    veilarbregistreringUrl = config.VEILARBREGISTRERING_GCP_URL
) {
    const router = Router();
    const DP_INNSYN_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:teamdagpenger:dp-innsyn`;

    router.get('/dagpenger-status', async (req, res) => {
        const token = getTokenFromCookie(req);
        const getTokenXHeaders = async () => {
            const tokenSet = await tokenDings.exchangeIDPortenToken(token, DP_INNSYN_CLIENT_ID);
            const accessToken = tokenSet.access_token;
            return { Authorization: `Bearer ${accessToken}`, TokenXAuthorization: `Bearer ${accessToken}` };
        };

        try {
            const headers = {
                headers: getDefaultHeaders(req),
            };

            const tokenXHeaders = {
                headers: {
                    ...headers.headers,
                    ...(await getTokenXHeaders()),
                },
            };

            const requests = await Promise.all([
                axios(`${veilarbregistreringUrl}/veilarbregistrering/api/startregistrering`, headers),
                axios(`${veilarbregistreringUrl}/veilarbregistrering/api/registrering`, headers),
                hentArbeidssokerPerioder(veilarbregistreringUrl, headers.headers, { fraOgMed: '2020-01-01' }),
                axios(`${dagpengerInnsynUrl}/paabegynte`, tokenXHeaders),
                axios(`${dagpengerInnsynUrl}/soknad`, tokenXHeaders),
                axios(`${dagpengerInnsynUrl}/vedtak`, tokenXHeaders),
            ]);

            const brukerInfoData = requests[0].data;
            const registreringData = requests[1].data;
            const arbeidssokerperioderData = requests[2].arbeidssokerperioder;
            const paabegynteSoknader = requests[3].data || [];
            const innsendteSoknader = requests[4].data || [];
            const dagpengeVedtak = requests[5].data || [];

            const arbeidssokerperioder = beregnArbeidssokerperioder({
                arbeidssokerperioder: arbeidssokerperioderData || [],
            });

            const dagpengerStatus = beregnDagpengeStatus({
                brukerInfoData,
                registreringData,
                paabegynteSoknader,
                innsendteSoknader,
                dagpengeVedtak,
                arbeidssokerperioder,
            });

            const antallDagerSidenDagpengerStanset =
                beregnAntallDagerSidenDagpengerStanset(dagpengerStatus, dagpengeVedtak) || 'N/A';

            return res.status(200).send({
                dagpengerStatus,
                antallDagerSidenDagpengerStanset,
            });
        } catch (err) {
            let status = 500;
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                status = axiosError.response?.status || 500;
                axiosLogError(axiosError);
            }
            logger.error(`Feil ved kall til /dagpenger-status ${err}`);
            return res.status(status).end();
        }
    });

    return router;
}

export default dagpengerStatus;
