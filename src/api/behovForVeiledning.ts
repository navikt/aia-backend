import { Router } from 'express';
import logger from '../logger';
import { BehovRepository } from '../db/behovForVeiledningRepository';
import { ValidatedRequest } from '../middleware/token-validation';

function behovForVeiledningRoutes(behovForVeiledningRepository: BehovRepository) {
    const router = Router();

    /**
     * @openapi
     * /behov-for-veiledning:
     *   get:
     *     description: Henter brukers svar på behov for veiledning
     *     responses:
     *       200:
     *         description: Vellykket forespørsel.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Oppfolging'
     *       204:
     *          description: Fant ingen svar for bruker
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     *       500:
     *         $ref: '#/components/schemas/Error'
     *   post:
     *     description: Lagrer brukers svar på behov for veiledning
     *     parameters:
     *       - in: body
     *         required: true
     *         schema:
     *           $ref: '#/components/schemas/Oppfolging'
     *     responses:
     *       201:
     *         description: Vellykket forespørsel.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Oppfolging'
     *       400:
     *         description: Forespørsel mangler i request body
     *       401:
     *         $ref: '#/components/schemas/Unauthorized'
     *       500:
     *          description: Noe gikk galt
     * components:
     *   schemas:
     *     Oppfolging:
     *       type: object
     *       properties:
     *         oppfolging:
     *           type: string
     *           enum: [STANDARD_INNSATS, SITUASJONSBESTEMT_INNSATS]
     *         dialogId:
     *           type: string
     */
    router.get('/behov-for-veiledning', async (req, res) => {
        try {
            const ident = (req as ValidatedRequest).user.ident;
            const behov = await behovForVeiledningRepository.hentBehov({ bruker_id: ident });

            if (!behov) {
                res.sendStatus(204);
                return;
            }

            res.status(200).send({
                oppfolging: behov.oppfolging,
                dato: behov.created_at,
                dialogId: behov.dialog_id,
                profileringId: behov.profilering_id,
            });
        } catch (err) {
            logger.error(`Feil ved henting av behov for veiledning: ${err}`);
            res.status(500).send((err as Error)?.message);
        }
    });

    return router;
}

export default behovForVeiledningRoutes;
