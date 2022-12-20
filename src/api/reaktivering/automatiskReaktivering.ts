import { RequestHandler, Router } from 'express';
import azureAdAuthentication from '../../middleware/azure-ad-authentication';
import { AutomatiskReaktiveringRepository } from '../../db/automatiskReaktiveringRepository';

function automatiskReaktiveringRoutes(
    repository: AutomatiskReaktiveringRepository,
    authMiddleware: RequestHandler = azureAdAuthentication
) {
    const router = Router();

    router.post('/azure/automatisk-reaktivering', authMiddleware, async (req, res) => {
        const { fnr } = req.body;

        if (!fnr) {
            res.status(400).send('mangler fnr');
            return;
        }

        const result = await repository.lagre(fnr);
        res.status(201).send(result);
    });

    return router;
}

export default automatiskReaktiveringRoutes;
