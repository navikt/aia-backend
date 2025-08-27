import { Request, Router } from 'express';
import config from '../../config';
import { Auth, getTokenFromRequest } from '../../auth/tokenDings';
import logger, { getCustomLogProps } from '../../logger';
import { proxyTokenXCall } from '../../http';

export const getTokenXHeardersForArbeidssokerregisteretV2 = (tokenDings: Auth) => async (req: Request) => {
    const incomingToken = getTokenFromRequest(req);
    const ARBEIDSSOKERREGISTERET_CLIENT_ID_V2 = `${config.NAIS_CLUSTER_NAME}:paw:paw-arbeidssoekerregisteret-api-oppslag-v2`;
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, ARBEIDSSOKERREGISTERET_CLIENT_ID_V2);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    } catch (e: any) {
        logger.error(
            getCustomLogProps(req),
            `Feil ved token-utveksling for paw-arbeidssokerregisteret-api-v2: ${e.message}`,
        );
        throw e;
    }
};

function arbeidssokerregisteretApiV2(tokenDings: Auth, url: string = config.ARBEIDSSOKERREGISTERET_OPPSLAG_API_V2_URL) {
    const router = Router();
    const getTokenXHeaders = getTokenXHeardersForArbeidssokerregisteretV2(tokenDings);

    router.get(
        '/arbeidssokerregisteret-v2/v1/arbeidssoekerperioder',
        proxyTokenXCall(`${url}/api/v1/arbeidssoekerperioder`, getTokenXHeaders),
    );

    router.get('/arbeidssokerregisteret-v2/v1/opplysninger-om-arbeidssoeker/:periodeId', (req, res) => {
        const { periodeId } = req.params;
        return proxyTokenXCall(`${url}/api/v1/opplysninger-om-arbeidssoeker/${periodeId}`, getTokenXHeaders)(req, res);
    });

    router.get('/arbeidssokerregisteret-v2/v1/profilering/:periodeId', (req, res) => {
        const { periodeId } = req.params;
        return proxyTokenXCall(`${url}/api/v1/profilering/${periodeId}`, getTokenXHeaders)(req, res);
    });

    router.get('/arbeidssokerregisteret-v2/arbeidssoekerperioder-aggregert', (req, res) => {
        const siste = req.query.siste === 'true';
        return proxyTokenXCall(
            `${url}/api/v1/arbeidssoekerperioder-aggregert${siste ? '?siste=true' : ''}`,
            getTokenXHeaders,
        )(req, res);
    });

    return router;
}

export default arbeidssokerregisteretApiV2;
