import { proxyHttpCall as proxy } from '../http';
import config from '../config';
import { Router } from 'express';

function veilarbregistrering(veilarbregistreringUrl = config.VEILARBREGISTRERING_GCP_URL): Router {
    const router = Router();

    /**
     * @openapi
     * /startregistrering:
     *   get:
     *     description: Henter oppfølgingsinformasjon om arbeidssøker.
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/StartRegistreringStatusDto'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/startregistrering', proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/startregistrering`));

    /**
     * @openapi
     * /registrering:
     *   get:
     *     description: Henter siste registrering av bruker.
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BrukerRegistreringWrapper'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/registrering', proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/registrering`));

    /**
     * @openapi
     * /fullfoerreaktivering:
     *   post:
     *     description: Gjennomfører enkel reaktivering av en bruker.
     *     responses:
     *       204: Bruker er reaktivert
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.post(
        '/fullfoerreaktivering',
        proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/fullfoerreaktivering`)
    );

    /**
     * @openapi
     * /standard-innsats:
     *   get:
     *     description:
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               type: boolean
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/standard-innsats',
        proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/profilering/standard-innsats`)
    );

    /**
     * @openapi
     * /arbeidssoker/perioder:
     *   get:
     *     parameters:
     *       - in: query
     *         name: fraOgMed
     *         required: true
     *         format: date
     *         type: string
     *         description: Dato YYYY-MM-DD
     *       - in: query
     *         name: tilOgMed
     *         required: false
     *         format: date
     *         type: string
     *         description: Dato YYYY-MM-DD
     *     description: Henter alle perioder hvor bruker er registrert som arbeidssøker.
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ArbeidssokerperioderDto'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/arbeidssoker/perioder',
        proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/perioder`, { overrideMethod: 'POST' })
    );

    /**
     * @openapi
     * /meldeplikt/siste:
     *   get:
     *     description: Henter siste meldekort for bruker.
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MeldekortDto'
     *       204:
     *         description: Ingen meldekort funnet.
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get(
        '/meldeplikt/siste',
        proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/meldekort/siste`)
    );
    /**
     * @openapi
     * /meldeplikt:
     *   get:
     *     description: Henter meldekortliste for bruker.
     *     responses:
     *       200:
     *         content:
     *          application/json:
     *             schema:
     *               $ref: '#/components/schemas/MeldekortDtoListe'
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     */
    router.get('/meldeplikt', proxy(`${veilarbregistreringUrl}/veilarbregistrering/api/arbeidssoker/meldekort`));
    return router;
}

export default veilarbregistrering;
