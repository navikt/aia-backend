import { Auth } from './auth/tokenDings';
import { v4 } from 'uuid';
import config from './config';
import logger from './logger';
import axios from 'axios';

export const createGetTokenX = (tokenDings: Auth) => async (incomingToken: string) => {
    const PAW_MICROFRONTEND_TOGGLER_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:paw-microfrontend-toggler`;
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, PAW_MICROFRONTEND_TOGGLER_CLIENT_ID);
        return tokenSet.access_token;
    } catch (e: any) {
        logger.error(`Feil ved token-utveksling for paw-microfrontend-toggler: ${e.message}`);
        throw e;
    }
};

const createMicrofrontendToggler = (tokenDings: Auth, url = config.PAW_MICROFRONTEND_TOGGLER_URL) => {
    const getTokenX = createGetTokenX(tokenDings);
    return {
        async toggle(action: 'enable' | 'disable', microfrontendId: string, userToken: string) {
            const traceId = v4();
            try {
                logger.info(`Toggler microfrontend: @action=${action}, id=${microfrontendId}, traceId=${traceId}`);
                await axios(`${url}/api/v1/microfrontend-toggle`, {
                    method: 'POST',
                    data: { '@action': action, microfrontend_id: microfrontendId },
                    headers: {
                        'Content-Type': 'application/json',
                        'X.Trace-Id': traceId,
                        Authorization: `Bearer ${await getTokenX(userToken)}`,
                    },
                });
            } catch (err: any) {
                logger.error(`Feil ved toggling av microfrontend traceId=${traceId}, error=${err.message}`);
                throw err;
            }
        },
    };
};

export default createMicrofrontendToggler;
