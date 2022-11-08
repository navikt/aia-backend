import { Router } from 'express';
import { ProfilRepository } from '../db/profilRepository';
import logger from '../logger';

function profilRoutes(profilRepository: ProfilRepository) {
    const router = Router();

    /**
     * @openapi
     * /profil:
     *   get:
     *     description: Henter lagrede profil innstillinger
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Profil'
     *       204:
     *         description: Fant ikke profil.
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     *       500:
     *         $ref: '#/components/schemas/Error'
     *   post:
     *     description: Lagrer profil innstillinger
     *     parameters:
     *       - in: body
     *         required: true
     *         schema:
     *           $ref: '#/components/schemas/Profil'
     *     responses:
     *       201:
     *         description: Vellykket forespørsel.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Profil'
     *       400:
     *         description: Forespørsel mangler i request body
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     *       500:
     *         $ref: '#/components/schemas/Error'
     * components:
     *   schemas:
     *     Profil:
     *       type: object
     *       properties:
     *         aiaFeedbackMeldekortForklaring:
     *           type: object
     *           $ref: '#/components/schemas/Feedback'
     *         aiaFeedbackHjelpOgStotteForklaring:
     *           type: object
     *           $ref: '#/components/schemas/Feedback'
     *         aiaFeedbackHjelpOgStotteForklaringUngdom:
     *           type: object
     *           $ref: '#/components/schemas/Feedback'
     *         aiaAvslaattEgenvurdering:
     *           type: string
     *         aiaAvslaattEgenvurderingUke12:
     *           type: string
     *         aiaValgtPengestotteVisning:
     *           type: string
     *         aiaReaktiveringVisning:
     *           $ref: '#/components/schemas/JaEllerNei'
     *     Feedback:
     *       type: object
     *       properties:
     *         updated:
     *           type: string
     *         valgt:
     *           type: string
     *     JaEllerNei:
     *       type: object
     *       properties:
     *         oppdatert:
     *           type: string
     *         valgt:
     *           type: string
     */
    router.get('/profil', async (req, res) => {
        try {
            const profil = await profilRepository.hentProfil(res.locals.user as string);

            if (!profil) {
                return res.sendStatus(204);
            }

            return res.send({ ...profil });
        } catch (err) {
            return res.status(500).send((err as Error)?.message);
        }
    });

    router.post('/profil', async (req, res) => {
        const profil = req.body;

        if (!profil) {
            return res.status(400).end();
        }

        try {
            const result = await profilRepository.lagreProfil({
                bruker: res.locals.user,
                profil,
            });
            return res.status(201).send(result.profil);
        } catch (err) {
            logger.error(`Feil ved lagring av profil ${err}`);
            return res.status(500).send(`${(err as Error).message}`);
        }
    });

    return router;
}

export default profilRoutes;
