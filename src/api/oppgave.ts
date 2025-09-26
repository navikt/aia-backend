import { Request, Response, Router } from 'express';
import logger, { axiosLogError } from '../logger';
import { ValidatedRequest } from '../middleware/token-validation';
import config from '../config';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { requestTexasAzureM2MToken } from '../auth/texas';
import { TokenResult } from '@navikt/oasis/dist/token-result';

export const createOppgaveRoutes = (requestAzureClientCredentialsToken: (scope: string) => Promise<TokenResult>) => {
    return (scope: string, oppgaveUrl = config.OPPGAVE_URL) => {
        const router = Router();

        async function getAzureAdToken() {
            const tokenResult = await requestAzureClientCredentialsToken(scope);

            if (!tokenResult.ok) {
                throw tokenResult.error;
            }

            return tokenResult.token;
        }

        function post(payload: any) {
            return async (req: Request, res: Response) => {
                try {
                    const azureAdToken = await getAzureAdToken();
                    const correlationId = uuidv4();
                    logger.info(
                        { x_callId: req.header('Nav-Call-Id') },
                        `Kaller oppgave api med X-Correlation-Id=${correlationId}`,
                    );

                    await axios(`${oppgaveUrl}/api/v1/oppgaver`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Correlation-ID': correlationId,
                            'Nav-Call-Id': req.header('Nav-Call-Id') || null,
                            [config.CONSUMER_ID_HEADER_NAME]: config.CONSUMER_ID_HEADER_VALUE,
                            Authorization: `Bearer ${azureAdToken}`,
                        },
                        data: payload,
                    });

                    res.status(201).end();
                } catch (e: any) {
                    logger.error({
                        error: e,
                        uuid: e?.response?.uuid,
                        feilmelding: e?.response?.feilmelding,
                        msg: 'Feil ved posting av ny oppgave',
                    });
                    const axiosError = e as AxiosError;
                    const status = axiosError.response?.status || 500;
                    axiosLogError(axiosError);
                    res.status(status).end();
                }
            };
        }

        router.post('/oppgave', async (req, res) => {
            const fnr = (req as ValidatedRequest).user.fnr;
            const { beskrivelse, dinSituasjon } = req.body;

            const situasjonerSomHaster = [
                'KONKURS',
                'OPPSIGELSE',
                'SAGT_OPP',
                'TILBAKE_TIL_JOBB',
                'NY_JOBB',
                'MIDLERTIDIG_JOBB',
            ];
            const erHasteSituasjon = situasjonerSomHaster.includes(dinSituasjon);
            const tildeltEnhetsnr = dinSituasjon === 'KONKURS' ? '4401' : '4450';

            const prioritet = erHasteSituasjon ? 'HOY' : 'NORM';
            const oppgavetype = erHasteSituasjon ? 'VUR_KONS_YTE' : 'VURD_HENV';

            const payload = {
                personident: fnr,
                beskrivelse,
                tildeltEnhetsnr,
                tema: 'DAG',
                oppgavetype,
                aktivDato: new Date().toISOString().substring(0, 10), // <yyyy-mm-dd>,
                prioritet,
            };

            await post(payload)(req, res);
        });

        router.post('/oppgave/under-18', async (req, res) => {
            const fnr = (req as ValidatedRequest).user.fnr;
            const { beskrivelse } = req.body;

            const payload = {
                personident: fnr,
                beskrivelse,
                tema: 'GEN',
                oppgavetype: 'KONT_BRUK',
                aktivDato: new Date().toISOString().substring(0, 10),
                prioritet: 'NORM',
            };

            await post(payload)(req, res);
        });
        return router;
    };
};

const oppgaveRoutes = createOppgaveRoutes(requestTexasAzureM2MToken);
export default oppgaveRoutes;
