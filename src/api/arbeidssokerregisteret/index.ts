import { Request, Router } from 'express';
import config from '../../config';
import { Auth, getTokenFromRequest } from '../../auth/tokenDings';
import logger, { getCustomLogProps } from '../../logger';
import { proxyTokenXCall } from '../../http';

const getTokenXHeardersForArbeidssokerregisteret = (tokenDings: Auth) => async (req: Request) => {
    const incomingToken = getTokenFromRequest(req);
    const ARBEIDSSOKERREGISTERET_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:paw-arbeidssokerregisteret-api`;
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, ARBEIDSSOKERREGISTERET_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    } catch (e: any) {
        logger.error(
            getCustomLogProps(req),
            `Feil ved token-utveksling for paw-arbeidssokerregisteret-api: ${e.message}`,
        );
        throw e;
    }
};
function arbeidssokerregisteretApi(tokenDings: Auth, url: string = config.ARBEIDSSOKERREGISTERET_API_URL) {
    const router = Router();
    const getTokenXHeaders = getTokenXHeardersForArbeidssokerregisteret(tokenDings);

    router.get('/v1/arbeidssoekerperioder', proxyTokenXCall(`${url}/api/v1/arbeidssoekerperioder`, getTokenXHeaders));
    router.get('/v1/opplysninger-om-arbeidssoeker/:periodeId', (req, res) => {
        const { periodeId } = req.params;
        return proxyTokenXCall(`${url}/v1/opplysninger-om-arbeidssoeker/${periodeId}`, getTokenXHeaders)(req, res);
    });
    router.get('/v1/profilering/:periodeId', (req, res) => {
        const { periodeId } = req.params;
        return proxyTokenXCall(`${url}/v1/profilering/${periodeId}`, getTokenXHeaders)(req, res);
    });

    return router;
}

export default arbeidssokerregisteretApi;
