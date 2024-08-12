import config from '../config';
import { Request } from 'express';
import { Auth, getTokenFromRequest } from '../auth/tokenDings';
import logger from '../logger';

export const getTokenXHeadersForVeilarbregistrering = (tokenDings: Auth) => async (req: Request) => {
    const VEILARBREGISTRERING_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:veilarbregistrering`;
    const incomingToken = getTokenFromRequest(req);
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, VEILARBREGISTRERING_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    } catch (e: any) {
        logger.error(`Feil ved token-utveksling for veilarbregistrering: ${e.message}`);
        throw e;
    }
};
