import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import healhApi from './api/health';
import unleashApi from './api/unleash';
import oppfolgingApi from './api/oppfolging';
import vedtakinfoApi from './api/vedtakinfo';
import dialogRoutes from './api/dialog';
import dagpengerApi from './api/dagpenger';
import meldekortApi from './api/meldekort';
import profilApi from './api/profil';
import behovForVeiledningApi from './api/behovForVeiledning';
import arbeidssokerApi from './api/arbeidssoker';
import veilarbregistreringApi from './api/veilarbregistrering';
import situasjonApi from './api/situasjon';
import swaggerDocs from './api/swagger';
import dagpengerStatusApi from './api/data/dagpengerStatus';
import bodyParser from 'body-parser';
import logger, { pinoHttpMiddleware } from './logger';
import config from './config';
import createDependencies from './deps';
import meldekortInaktivering from './api/data/meldekortInaktivering';
import automatiskReaktiveringApi from './api/reaktivering/automatiskReaktivering';
import reaktiveringApi from './api/reaktivering/automatiskReaktiveringSvar';
import tokenValidation from './middleware/token-validation';
import nivaa4Authentication from './middleware/nivaa4-authentication';

const PORT = 3000;
const app = express();
const router = express.Router();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(pinoHttpMiddleware());
app.use(helmet());
app.use(cors({ origin: /\.nav\.no$/, credentials: true }));
app.disable('x-powered-by');

async function setUpRoutes() {
    const {
        tokenDings,
        profilRepository,
        behovRepository,
        automatiskReaktiveringRepository,
        automatiskReaktiveringSvarRepository,
        automatiskReaktivertProducer,
    } = createDependencies();

    // Public routes
    router.use(swaggerDocs());
    router.use(healhApi());
    router.use(unleashApi());

    // azure ad
    router.use(automatiskReaktiveringApi(automatiskReaktiveringRepository, await automatiskReaktivertProducer));

    // id porten
    // router.use(idportenAuthentication);
    router.use(tokenValidation);

    router.use(oppfolgingApi(await tokenDings));
    router.use(vedtakinfoApi(await tokenDings));
    router.use(dialogRoutes(await tokenDings));
    router.use(veilarbregistreringApi(await tokenDings));
    router.use(arbeidssokerApi(await tokenDings));

    // level4
    router.use(nivaa4Authentication);
    router.use(dagpengerApi(await tokenDings));
    router.use(meldekortApi(await tokenDings));
    router.use(profilApi(profilRepository));
    router.use(behovForVeiledningApi(behovRepository));
    router.use(dagpengerStatusApi(await tokenDings));
    router.use(meldekortInaktivering(await tokenDings));
    router.use(
        reaktiveringApi(
            automatiskReaktiveringRepository,
            automatiskReaktiveringSvarRepository,
            await automatiskReaktivertProducer
        )
    );
    router.use(situasjonApi(await tokenDings));

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
