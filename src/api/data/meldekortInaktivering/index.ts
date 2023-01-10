import { Router } from 'express';
import axios, { AxiosError } from 'axios';
import config from '../../../config';
import { axiosLogError } from '../../../logger';
import { MeldekortDto } from './typer';
import { beregnMeldekortStatus, grupperMeldekort } from './beregnMeldekortStatus';
import { getDefaultHeaders } from '../../../http';

function meldekortInaktivering(veilarbregistreringUrl = config.VEILARBREGISTRERING_GCP_URL) {
    const router = Router();

    router.get('/data/meldekort-inaktivering', async (req, res) => {
        try {
            const meldekort = await axios<MeldekortDto[]>(
                `${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/meldekort`,
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
