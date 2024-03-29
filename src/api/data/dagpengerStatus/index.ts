import { Router } from 'express';
import config from '../../../config';
import axios, { AxiosError } from 'axios';
import { hentArbeidssokerPerioder } from '../../arbeidssoker';
import { Auth, getTokenFromRequest } from '../../../auth/tokenDings';
import beregnDagpengeStatus from './beregnDagpengeStatus';
import beregnArbeidssokerperioder from './beregnArbeidssokerPerioder';
import logger, { axiosLogError } from '../../../logger';
import beregnAntallDagerSidenDagpengerStanset from './beregnAntallDagerSidenDagpengerStanset';
import { getDefaultHeaders } from '../../../http';
import { getTokenXHeadersForVeilarbregistrering } from '../../veilarbregistrering';

function dagpengerStatus(
    tokenDings: Auth,
    dagpengerInnsynUrl = config.DAGPENGER_INNSYN_URL,
    veilarbregistreringUrl = config.VEILARBREGISTRERING_URL
) {
    const router = Router();
    const DP_INNSYN_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:teamdagpenger:dp-innsyn`;

    router.get('/dagpenger-status', async (req, res) => {
        const token = getTokenFromRequest(req);
        const getTokenXHeadersForDpInnsyn = async () => {
            const tokenSet = await tokenDings.exchangeIDPortenToken(token, DP_INNSYN_CLIENT_ID);
            const accessToken = tokenSet.access_token;
            return { Authorization: `Bearer ${accessToken}`, TokenXAuthorization: `Bearer ${accessToken}` };
        };

        try {
            const veilarbregistreringHeaders = {
                headers: {
                    ...getDefaultHeaders(req),
                    ...(await getTokenXHeadersForVeilarbregistrering(tokenDings)(req)),
                },
            };

            const dpInnsynHeaders = {
                headers: {
                    ...getDefaultHeaders(req),
                    ...(await getTokenXHeadersForDpInnsyn()),
                },
            };

            const requests = await Promise.all([
                axios(
                    `${veilarbregistreringUrl}/veilarbregistrering/api/startregistrering`,
                    veilarbregistreringHeaders
                ),
                axios(`${veilarbregistreringUrl}/veilarbregistrering/api/registrering`, veilarbregistreringHeaders),
                hentArbeidssokerPerioder(veilarbregistreringUrl, veilarbregistreringHeaders.headers, {
                    fraOgMed: '2020-01-01',
                }),
                axios(`${dagpengerInnsynUrl}/paabegynte`, dpInnsynHeaders),
                axios(`${dagpengerInnsynUrl}/soknad`, dpInnsynHeaders),
                axios(`${dagpengerInnsynUrl}/vedtak`, dpInnsynHeaders),
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
