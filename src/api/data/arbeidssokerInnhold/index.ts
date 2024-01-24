import { Router } from 'express';
import { Auth } from '../../../auth/tokenDings';
import config from '../../../config';
import axios from 'axios';
import { getDefaultHeaders } from '../../../http';
import { getTokenXHeadersForVeilarbregistrering } from '../../veilarbregistrering';
import { getTokenXHeadersForDialog } from '../../dialog';
import { getTokenXHeadersForVeilarboppfolging } from '../../arbeidssoker';

function arbeidssokerInnhold(
    tokenDings: Auth,
    veilarboppfolgingUrl = config.VEILARBOPPFOLGING_URL,
    veilarbregistreringUrl = config.VEILARBREGISTRERING_URL,
    dialogApiUrl = config.VEILARBDIALOG_API_URL,
) {
    const router = Router();
    const timeout = 5000;
    router.get('/data/arbeidssoker-innhold', async (req, res) => {
        try {
            const requests = await Promise.allSettled([
                axios(`${veilarboppfolgingUrl}/veilarboppfolging/api/oppfolging`, {
                    timeout,
                    headers: {
                        ...getDefaultHeaders(req),
                        ...(await getTokenXHeadersForVeilarboppfolging(tokenDings)(req)),
                    },
                }),
                axios(`${veilarbregistreringUrl}/veilarbregistrering/api/registrering`, {
                    timeout,
                    headers: {
                        ...getDefaultHeaders(req),
                        ...(await getTokenXHeadersForVeilarbregistrering(tokenDings)(req)),
                    },
                }),
                axios(`${veilarbregistreringUrl}/veilarbregistrering/api/startregistrering`, {
                    timeout,
                    headers: {
                        ...getDefaultHeaders(req),
                        ...(await getTokenXHeadersForVeilarbregistrering(tokenDings)(req)),
                    },
                }),
                axios(`${dialogApiUrl}/dialog/antallUleste`, {
                    timeout,
                    headers: {
                        ...getDefaultHeaders(req),
                        ...(await getTokenXHeadersForDialog(tokenDings)(req)),
                    },
                }),
            ]);

            const requestKeys = ['oppfolging', 'brukerregistrering', 'brukerInfo', 'ulesteDialoger'];

            const result = requests.reduce((acc, currentValue, currentIndex) => {
                let currentResult;
                if (currentValue.status === 'fulfilled') {
                    currentResult = {
                        status: currentValue.value.status,
                        data: currentValue.value.data,
                    };
                }
                if (currentValue.status === 'rejected') {
                    currentResult = {
                        error: currentValue.reason.message,
                        status: currentValue.reason.status || 500,
                    };
                }
                return {
                    ...acc,
                    [requestKeys[currentIndex]]: {
                        ...currentResult,
                    },
                };
            }, {});
            res.status(200).send(result);
        } catch (err) {
            res.status(500).end();
        }
    });
    return router;
}

export default arbeidssokerInnhold;
