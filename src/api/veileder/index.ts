import { Router, Request } from 'express';
import config from '../../config';
import { getDefaultHeaders, proxyHttpCall } from '../../http';
import axios, { AxiosError } from 'axios';
import { BehovRepository } from '../../db/behovForVeiledningRepository';
import logger from '../../logger';
import { requestAzureOboToken } from '@navikt/oasis';
import { getTokenFromRequest } from '../../auth/tokenDings';

const PAW_TILGANGSKONTROLL_SCOPE = `api://${process.env.NAIS_CLUSTER_NAME}.paw.paw-tilgangskontroll/.default`;

type GetOboToken = (req: Request) => Promise<string>;

const getOboTokenFn = async (req: Request) => {
    const result = await requestAzureOboToken(getTokenFromRequest(req), PAW_TILGANGSKONTROLL_SCOPE);
    return result.ok ? result.token : 'token';
};

function veilederApi(
    behovForVeiledningRepository: BehovRepository,
    besvarelseUrl = config.BESVARELSE_URL,
    tilgangskontrollUrl = config.PAW_TILGANGSKONTROLL_API_URL,
    getOboToken: GetOboToken = getOboTokenFn,
) {
    const router = Router();

    router.post('/veileder/besvarelse', proxyHttpCall(`${besvarelseUrl}/api/v1/veileder/besvarelse`));

    router.post('/veileder/behov-for-veiledning', async (req, res) => {
        try {
            const { foedselsnummer } = req.body;

            if (!foedselsnummer) {
                res.status(400).send('missing foedselsnummer');
                return;
            }

            const { status, data } = await axios(`${tilgangskontrollUrl}/api/v1/tilgang`, {
                headers: {
                    ...getDefaultHeaders(req),
                    Authorization: `Bearer ${await getOboToken(req)}`,
                },
                method: 'POST',
                data: { identitetsnummer: foedselsnummer },
            });

            logger.info(data, 'Tilgangskontroll data');

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
