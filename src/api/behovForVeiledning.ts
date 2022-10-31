import { Router } from 'express';
import log from '../logger';
import { getSubjectFromToken } from '../auth/tokenDings';
import { BehovRepository } from '../db/behovForVeiledningRepository';

function behovForVeiledningRoutes(behovForVeiledningRepository: BehovRepository) {
    const router = Router();

    /**
     * @openapi
     * /behov-for-veiledning:
     *   get:
     *     description: Henter brukers svar på behov for veiledning
     *     responses:
     *       200:
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Oppfolging'
     *       204:
     *          description: Fant ingen svar for bruker
     *       401:
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
     *       500:
     *         description: Noe gikk galt
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
     *         description: Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie.
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
        const ident = getSubjectFromToken(req);
        if (!ident) {
            log.error('fikk ikke hentet ident fra token');
            return res.sendStatus(401);
        }

        try {
            const behov = await behovForVeiledningRepository.hentBehov(ident as string);

            if (!behov) {
                return res.sendStatus(204);
            }

            return res.send({ oppfolging: behov.oppfolging, dato: behov.created_at, dialogId: behov.dialog_id });
        } catch (err) {
            log.error(`Feil ved henting av behov for veiledning: ${err}`);
            return res.status(500).send((err as Error)?.message);
        }
    });

    router.post('/behov-for-veiledning', async (req, res) => {
        const ident = getSubjectFromToken(req) as string;
        if (!ident) {
            log.error('fikk ikke hentet ident fra token');
            return res.sendStatus(401);
        }

        const { oppfolging, dialogId } = req.body;

        if (!oppfolging) {
            log.error('mangler "oppfolging" i request body');
            return res.status(400).end();
        }

        try {
            const result = await behovForVeiledningRepository.lagreBehov({
                bruker: ident,
                oppfolging: oppfolging,
                dialogId,
            });

            return res
                .status(201)
                .send({ oppfolging: result.oppfolging, dato: result.created_at, dialogId: result.dialog_id });
        } catch (err) {
            log.error(`Feil ved oppretting av behov for veiledning ${err}`);
            return res.status(500).send(`${(err as Error).message}`);
        }
    });

    return router;
}

export default behovForVeiledningRoutes;
