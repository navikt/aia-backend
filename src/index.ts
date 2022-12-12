import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import healhApi from './api/health';
import unleashApi from './api/unleash';
import ptoProxyApi from './api/ptoproxy';
import dagpengerApi from './api/dagpenger';
import meldekortApi from './api/meldekort';
import profilApi from './api/profil';
import behovForVeiledningApi from './api/behovForVeiledning';
import arbeidssokerApi from './api/arbeidssoker';
import veilarbregistreringApi from './api/veilarbregistrering';
import swaggerDocs from './api/swagger';
import dagpengerStatusApi from './api/data/dagpengerStatus';
import bodyParser from 'body-parser';
import logger, { pinoHttpMiddleware } from './logger';
import config from './config';
import createDependencies from './deps';
import meldekortInaktivering from './api/data/meldekortInaktivering';
import idportenAuth from './middleware/idportenAuth';

const PORT = 3000;
const app = express();
const router = express.Router();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(pinoHttpMiddleware());
app.use(helmet());
app.use(cors());
app.disable('x-powered-by');

async function setUpRoutes() {
    const { tokenDings, profilRepository, behovRepository } = createDependencies();

    // Public routes
    router.use(swaggerDocs());
    router.use(healhApi());
    router.use(unleashApi());

    // Idporten auth routes
    router.use(idportenAuth);
    router.use(ptoProxyApi());
    router.use(veilarbregistreringApi());
    router.use(arbeidssokerApi());
    router.use(dagpengerApi(await tokenDings));
    router.use(meldekortApi(await tokenDings));
    router.use(profilApi(profilRepository));
    router.use(behovForVeiledningApi(behovRepository));
    router.use(dagpengerStatusApi(await tokenDings));
    router.use(meldekortInaktivering());
    app.use(config.BASE_PATH || '', router);
}

const startServer = async () => {
    try {
        await setUpRoutes();
        logger.info(`Starting server...`);
        app.listen(PORT, () => {
            logger.info('Server running at http://localhost:3000');
        });
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
};

startServer();
