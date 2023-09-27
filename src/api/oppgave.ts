import { Router } from 'express';
import logger, { axiosLogError } from '../logger';
import { getAzureAdToken } from '../auth/azure';
import { ValidatedRequest } from '../middleware/token-validation';
import config from '../config';
import axios, { AxiosError } from 'axios';
import { v4 } from 'uuid';

export const createOppgaveRoutes = (getAzureAdToken: (scope: string) => Promise<string>) => {
    return (scope: string, oppgaveUrl = config.OPPGAVE_URL) => {
        const router = Router();

        router.post('/oppgave', async (req, res) => {
            try {
                const fnr = (req as ValidatedRequest).user.fnr;
                const azureAdToken = await getAzureAdToken(scope);
                const { beskrivelse } = req.body;
                const payload = {
                    personident: fnr,
                    beskrivelse,
                    tema: 'DAG',
                    oppgavetype: 'VUR_KONS_YTE',
                    aktivDato: new Date().toISOString().substring(0, 10), // <yyyy-mm-dd>,
                    prioritet: 'HOY',
                };

                const correlationId = v4();
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
                logger.error(e, `Feil ved posting av ny oppgave`);
                const axiosError = e as AxiosError;
                const status = axiosError.response?.status || 500;
                axiosLogError(axiosError);
                res.status(status).end();
            }
        });

        return router;
    };
};

const oppgaveRoutes = createOppgaveRoutes(getAzureAdToken);
export default oppgaveRoutes;
