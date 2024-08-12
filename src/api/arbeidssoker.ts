import { Router } from 'express';

function arbeidssokerRoutes() {
    const router = Router();

    router.get('/er-arbeidssoker', async (req, res) => {
        // Legacy api kall
        return res.send({
            erArbeidssoker: false,
            erStandard: false,
            brukNyAia: false,
        });
    });

    return router;
}

export default arbeidssokerRoutes;
