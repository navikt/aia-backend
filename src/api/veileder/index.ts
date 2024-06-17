import { Router } from 'express';
import config from '../../config';
import { getDefaultHeaders, proxyHttpCall } from '../../http';
import axios, { AxiosError } from 'axios';
import { BehovRepository } from '../../db/behovForVeiledningRepository';
import logger from '../../logger';

function veilederApi(behovForVeiledningRepository: BehovRepository, besvarelseUrl = config.BESVARELSE_URL) {
    const router = Router();

    router.post('/veileder/besvarelse', proxyHttpCall(`${besvarelseUrl}/api/v1/veileder/besvarelse`));

    router.post('/veileder/behov-for-veiledning', async (req, res) => {
        try {
            const { foedselsnummer } = req.body;

            if (!foedselsnummer) {
                res.status(400).send('missing foedselsnummer');
                return;
            }

            const { status } = await axios(`${besvarelseUrl}/api/v1/veileder/har-tilgang`, {
                headers: getDefaultHeaders(req),
                method: 'POST',
                data: { foedselsnummer },
            });

            if (status === 200) {
                const behov = await behovForVeiledningRepository.hentBehov({ foedselsnummer });

                if (behov) {
                    res.send({
                        oppfolging: behov.oppfolging,
                        dato: behov.created_at,
                        dialogId: behov.dialog_id,
                        tekster: {
                            sporsmal: 'Hva slags veiledning ønsker du?',
                            svar: {
                                STANDARD_INNSATS: 'Jeg ønsker å klare meg selv',
                                SITUASJONSBESTEMT_INNSATS: 'Jeg ønsker oppfølging fra NAV',
                            },
                        },
                    });
                } else {
                    res.status(204).end();
                }
            }
        } catch (err: any) {
            logger.error(`Feil i /veileder/behov-for-veiledning: ${err.message}`, err);
            const errorResponse = (err as AxiosError).response;
            res.status(errorResponse?.status || 500).end();
        }
    });

    return router;
}

export default veilederApi;
