import { Router } from 'express';
import { getTokenFromCookie } from '../../../auth/tokenDings';
import axios, { AxiosError } from 'axios';
import config from '../../../config';
import { axiosLogError } from '../../../logger';
import { MeldekortDto } from './typer';
import { beregnMeldekortStatus, grupperMeldekort } from './beregnMeldekortStatus';
import { getDefaultHeaders } from '../../../http';

function meldekortInaktivering(veilarbregistreringGcpUrl = config.VEILARBREGISTRERING_GCP_URL) {
    const router = Router();

    router.get('/data/meldekort-inaktivering', async (req, res) => {
        const token = getTokenFromCookie(req);

        if (!token) {
            return res.status(401).end();
        }

        try {
            const meldekort = await axios<MeldekortDto[]>(
                `${veilarbregistreringGcpUrl}/veilarbregistrering/api/arbeidssoker/meldekort`,
                {
                    headers: getDefaultHeaders(req),
                }
            );

            const grupperteMeldekort = grupperMeldekort(meldekort.data);
            const meldekortStatus = beregnMeldekortStatus(grupperteMeldekort);

            return res.status(200).send({ meldekortStatus });
        } catch (err) {
            const axiosError = err as AxiosError;
            const status = axiosError.response?.status || 500;
            axiosLogError(axiosError);
            return res.status(status).end();
        }
    });

    return router;
}

export default meldekortInaktivering;
