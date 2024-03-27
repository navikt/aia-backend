import { Request, Router } from 'express';
import { proxyTokenXCall } from '../../http';
import { Auth, getTokenFromRequest } from '../../auth/tokenDings';
import config from '../../config';
import logger, { getCustomLogProps } from '../../logger';
import { ValidatedRequest } from '../../middleware/token-validation';

export const getTokenXHeadersForInngangsApi = (tokenDings: Auth) => async (req: Request) => {
    const incomingToken = getTokenFromRequest(req);
    const INNGANGS_API_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:paw-arbeidssokerregisteret-api-inngang`;
    try {
        const tokenSet = await tokenDings.exchangeIDPortenToken(incomingToken, INNGANGS_API_CLIENT_ID);
        const token = tokenSet.access_token;
        return { Authorization: `Bearer ${token}` };
    } catch (e: any) {
        logger.error(
            getCustomLogProps(req),
            `Feil ved token-utveksling for paw-arbeidssokerregisteret-api-inngang: ${e.message}`,
        );
        throw e;
    }
};

function inngangRoutes(tokenDings: Auth, url: string = config.ARBEIDSSOKERREGISTERET_INNGANG_API_URL) {
    const router = Router();
    const getTokenXHeaders = getTokenXHeadersForInngangsApi(tokenDings);
    router.post('/v1/arbeidssoker/opplysninger', (req, res) => {
        const identitetsnummer = (req as ValidatedRequest).user.fnr;
        return proxyTokenXCall(`${url}/api/v1/arbeidssoker/opplysninger`, getTokenXHeaders, {
            transformRequestBody(request) {
                return {
                    ...request.body,
                    identitetsnummer,
                };
            },
        })(req, res);
    });
    return router;
}

export default inngangRoutes;
