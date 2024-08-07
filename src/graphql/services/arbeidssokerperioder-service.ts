import config from '../../config';
import axios from 'axios';
import { v4 } from 'uuid';
import logger from '../../logger';
import { requestTokenxOboToken } from '@navikt/oasis';

export async function arbeidssokerregisteretOppslagApi(
    path: string,
    token: string,
    url: string = config.ARBEIDSSOKERREGISTERET_OPPSLAG_API_URL,
) {
    const traceId = v4();
    const ARBEIDSSOKERREGISTERET_CLIENT_ID = `${config.NAIS_CLUSTER_NAME}:paw:paw-arbeidssoekerregisteret-api-oppslag`;
    const tokenX = await requestTokenxOboToken(token, ARBEIDSSOKERREGISTERET_CLIENT_ID);

    if (!tokenX.ok) {
        throw new Error(
            `Feil med tokenX utveksling til arbeidssokerregisteret-api-oppslag, traceId: ${traceId}, reason: ${tokenX.error.message}`,
            { cause: tokenX.error },
        );
    }

    try {
        logger.info(`Gjør graphQL data-oppslog mot ${url}/${path}, traceId=${traceId}`);
        const { data } = await axios(`${url}/${path}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X.Trace-Id': traceId,
                Authorization: `Bearer ${tokenX.token}`,
            },
        });
        logger.info(`Ferdig med data-oppslog mot ${url}/${path}, traceId=${traceId}`);
        return data;
    } catch (err: any) {
        logger.error(`Feil => traceId=${traceId}, error=${err.message}`);
        throw err;
    }
}

export async function getArbeidssokerperioder(token: string) {
    return arbeidssokerregisteretOppslagApi('/api/v1/arbeidssoekerperioder', token);
}

export async function getOpplysninger(token: string, periodeId: string) {
    return arbeidssokerregisteretOppslagApi(`/api/v1/opplysninger-om-arbeidssoeker/${periodeId}`, token);
}
