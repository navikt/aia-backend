import { Request, Router } from 'express';
import { proxyTokenXCall } from '../../http';
import { Auth, getTokenFromRequest } from '../../auth/tokenDings';
import config from '../../config';
import logger, { getCustomLogProps } from '../../logger';

export const getTokenXHearders = (tokenDings: Auth) => async (req: Request) => {
    const incomingToken = getTokenFromRequest(req);
    const BEKREFTELSE_API_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:paw-arbeidssoekerregisteret-api-bekreftelse`;
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, BEKREFTELSE_API_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    } catch (e: any) {
        logger.error(
            getCustomLogProps(req),
            `Feil ved token-utveksling for paw-arbeidssoekerregisteret-api-bekreftelse: ${e.message}`,
        );
        throw e;
    }
};

function tilgjengeligeBekreftelserApi(tokenDings: Auth, url: string = config.BEKREFTELSE_API_URL) {
    const router = Router();

    router.get(
        '/tilgjengelige-bekreftelser',
        proxyTokenXCall(`${url}/api/v1/tilgjengelige-bekreftelser`, getTokenXHearders(tokenDings)),
    );

    return router;
}

export default tilgjengeligeBekreftelserApi;
