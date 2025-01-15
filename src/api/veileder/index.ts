import { Router, Request } from 'express';
import config from '../../config';
import { getDefaultHeaders, proxyHttpCall } from '../../http';
import axios, { AxiosError } from 'axios';
import { BehovRepository } from '../../db/behovForVeiledningRepository';
import logger from '../../logger';
import { parseAzureUserToken as parseAzureUserTokenFn, requestAzureOboToken } from '@navikt/oasis';
import { getTokenFromRequest } from '../../auth/tokenDings';
import { TokenResult } from '@navikt/oasis/dist/token-result';

const PAW_TILGANGSKONTROLL_SCOPE = `api://${process.env.NAIS_CLUSTER_NAME}.paw.paw-tilgangskontroll/.default`;

type GetOboToken = (req: Request) => Promise<TokenResult>;

const getOboTokenFn = async (req: Request): Promise<TokenResult> => {
    return await requestAzureOboToken(getTokenFromRequest(req), PAW_TILGANGSKONTROLL_SCOPE);
};

function veilederApi(
    behovForVeiledningRepository: BehovRepository,
    besvarelseUrl = config.BESVARELSE_URL,
    tilgangskontrollUrl = config.PAW_TILGANGSKONTROLL_API_URL,
    getOboToken: GetOboToken = getOboTokenFn,
    parseAzureUserToken = parseAzureUserTokenFn,
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

            const oboToken = await getOboToken(req);
            if (!oboToken.ok) {
                res.status(401).end();
                return;
            }

            const parsedToken = parseAzureUserToken(oboToken.token);
            const navAnsattId = parsedToken.ok && parsedToken.NAVident;

            const { status, data } = await axios(`${tilgangskontrollUrl}/api/v1/tilgang`, {
                headers: {
                    ...getDefaultHeaders(req),
                    Authorization: `Bearer ${oboToken.token}`,
                },
                method: 'POST',
                data: { identitetsnummer: foedselsnummer, navAnsattId, tilgang: 'LESE' },
            });

            logger.info(`Status fra api/tilgang=${status}`);
            if (!data.harTilgang) {
                logger.info(data, 'Bruker mangler tilgang');
                res.status(403).end();
                return;
            }

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
        } catch (err: any) {
            logger.error(`Feil i /veileder/behov-for-veiledning: ${err.message}`, err);
            const errorResponse = (err as AxiosError).response;
            res.status(errorResponse?.status || 500).end();
        }
    });

    return router;
}

export default veilederApi;
