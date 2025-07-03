import { Request, Router } from 'express';
import config from '../../config';
import { getDefaultHeaders, proxyTokenXCall } from '../../http';
import axios, { AxiosError } from 'axios';
import { BehovRepository } from '../../db/behovForVeiledningRepository';
import logger from '../../logger';
import { parseAzureUserToken as parseAzureUserTokenFn, requestAzureOboToken } from '@navikt/oasis';
import { getTokenFromRequest } from '../../auth/tokenDings';
import { TokenResult } from '@navikt/oasis/dist/token-result';

const PAW_TILGANGSKONTROLL_SCOPE = `api://${config.NAIS_CLUSTER_NAME}.paw.paw-tilgangskontroll/.default`;
const OPPSLAG_API_SCOPE = `api://${config.NAIS_CLUSTER_NAME}.paw.paw-arbeidssoekerregisteret-api-oppslag/.default`;

type GetOboToken = (req: Request, clientId: string) => Promise<TokenResult>;

const getOboTokenFn = async (req: Request, clientId: string): Promise<TokenResult> => {
    return await requestAzureOboToken(getTokenFromRequest(req), clientId);
};

function veilederApi(
    behovForVeiledningRepository: BehovRepository,
    tilgangskontrollUrl = config.PAW_TILGANGSKONTROLL_API_URL,
    getOboToken: GetOboToken = getOboTokenFn,
    parseAzureUserToken = parseAzureUserTokenFn,
    oppslagApiUrl = config.ARBEIDSSOKERREGISTERET_OPPSLAG_API_URL,
) {
    const router = Router();

    /**
     * @openapi
     * /veileder/behov-for-veiledning:
     *   post:
     *     parameters:
     *       - in: body
     *         required: true
     *         schema:
     *           $ref: '#/components/schemas/BehovForVeiledningRequest'
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BehovForVeiledningResponse'
     *       400:
     *         description: Forespørsel mangler foedselsnummer i request body
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     *       500:
     *         description: Noe gikk galt
     */
    router.post('/veileder/behov-for-veiledning', async (req, res) => {
        try {
            const foedselsnummer = req.body?.foedselsnummer;

            if (!foedselsnummer) {
                res.status(400).send('missing foedselsnummer');
                return;
            }

            const oboToken = await getOboToken(req, PAW_TILGANGSKONTROLL_SCOPE);
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
            logger.error(err, `Feil i /veileder/behov-for-veiledning: ${err.message}`);
            const errorResponse = (err as AxiosError).response;
            res.status(errorResponse?.status || 500).end();
        }
    });

    const getOppslagApiHeaders = async (req: Request) => {
        const oboToken = await getOboToken(req, OPPSLAG_API_SCOPE);
        if (!oboToken.ok) {
            logger.error(oboToken.error, `Feil ved utveksling av azure obo-token for ${OPPSLAG_API_SCOPE}`);
        }
        const token = oboToken.ok ? oboToken.token : '';

        return {
            ...getDefaultHeaders(req),
            Authorization: `Bearer ${token}`,
        };
    };
    /**
     * @openapi
     * /veileder/egenvurderinger:
     *   post:
     *     parameters:
     *       - in: body
     *         required: true
     *         schema:
     *           $ref: '#/components/schemas/VeilederEgenvurderingerRequest'
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/VeilederEgenvurderingerResponse'
     *       400:
     *         description: Feil i request body
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     *       500:
     *         description: Noe gikk galt
     */
    router.post(
        '/veileder/egenvurderinger',
        proxyTokenXCall(
            `${oppslagApiUrl}/api/v1/veileder/profilering/egenvurderinger?siste=true`,
            getOppslagApiHeaders,
        ),
    );

    return router;
}

export default veilederApi;
