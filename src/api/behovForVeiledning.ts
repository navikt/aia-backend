import { Router } from 'express';
import logger from '../logger';
import { BehovRepository } from '../db/behovForVeiledningRepository';
import { IdPortenRequest } from '../middleware/idporten-authentication';

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
            const ident = (req as IdPortenRequest).user.ident;
            const behov = await behovForVeiledningRepository.hentBehov(ident as string);

            if (!behov) {
                return res.sendStatus(204);
            }

            return res.send({ oppfolging: behov.oppfolging, dato: behov.created_at, dialogId: behov.dialog_id });
        } catch (err) {
            logger.error(`Feil ved henting av behov for veiledning: ${err}`);
            return res.status(500).send((err as Error)?.message);
        }
    });

    router.post('/behov-for-veiledning', async (req, res) => {
        const { oppfolging, dialogId } = req.body;

        if (!oppfolging) {
            logger.error('mangler "oppfolging" i request body');
            return res.status(400).end();
        }

        try {
            const ident = (req as IdPortenRequest).user.ident;
            const result = await behovForVeiledningRepository.lagreBehov({
                bruker: ident,
                oppfolging: oppfolging,
                dialogId,
            });

            return res
                .status(201)
                .send({ oppfolging: result.oppfolging, dato: result.created_at, dialogId: result.dialog_id });
        } catch (err) {
            logger.error(`Feil ved oppretting av behov for veiledning ${err}`);
            return res.status(500).send(`${(err as Error).message}`);
        }
    });

    return router;
}

export default behovForVeiledningRoutes;
