import { Router } from 'express';
import { AutomatiskReaktiveringRepository } from '../../db/automatiskReaktiveringRepository';
import { AutomatiskReaktiveringSvarRepository } from '../../db/automatiskReaktiveringSvarRepository';
import { KafkaProducer } from '../../kafka/automatisk-reaktivert-producer';
import logger from '../../logger';
import { ValidatedRequest } from '../../middleware/token-validation';

function automatiskReaktiveringSvarRoutes(
    reaktiveringRepository: AutomatiskReaktiveringRepository,
    svarRepository: AutomatiskReaktiveringSvarRepository,
    automatiskReaktivertProducer: KafkaProducer
) {
    const router = Router();

    router.get('/reaktivering', async (req, res) => {
        const brukerId = (req as ValidatedRequest).user.fnr;

        try {
            const automatiskReaktivering = await reaktiveringRepository.hent(brukerId);

            if (!automatiskReaktivering) {
                res.status(204).end();
            } else {
                const svar = await svarRepository.hent(brukerId, automatiskReaktivering.id);

                res.send({
                    opprettetDato: automatiskReaktivering.created_at,
                    svar: svar
                        ? {
                              opprettetDato: svar.created_at,
                              svar: svar.svar,
                          }
                        : null,
                });
            }
        } catch (err) {
            logger.error(`Feil ved henting av automatiskReaktivering: ${err}`);
            res.status(500).end();
        }
    });

    router.post('/reaktivering', async (req, res) => {
        const brukerId = (req as ValidatedRequest).user.fnr;
        const svar = req.body.svar;

        if (!svar) {
            logger.error(`Feil ved reaktivering-svar: mangler svar`);
            res.status(400).send('mangler svar i request body');
            return;
        }

        try {
            const reaktivering = await reaktiveringRepository.hent(brukerId);

            if (!reaktivering) {
                logger.error(`Feil ved reaktivering-svar: finner ikke reaktivering for bruker`);
                res.status(400).send('finner ikke reaktivering for bruker');
                return;
            }

            const result = await svarRepository.lagre({
                brukerId,
                svar,
                automatiskReaktiveringId: reaktivering.id,
            });

            await automatiskReaktivertProducer.send([result]);

            res.status(201).send({
                opprettetDato: reaktivering.created_at,
                svar: {
                    opprettetDato: result.created_at,
                    svar: result.svar,
                },
            });
        } catch (err) {
            logger.error(`Feil ved reaktivering-svar: ${err}`);
            res.status(500).end();
        }
    });

    return router;
}

export default automatiskReaktiveringSvarRoutes;
