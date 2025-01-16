import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import healhApi from './api/health';
import unleashApi from './api/unleash';
import vedtakinfoApi from './api/vedtakinfo';
import dialogRoutes from './api/dialog';
import profilApi from './api/profil';
import behovForVeiledningApi from './api/behovForVeiledning';
import arbeidssokerApi from './api/arbeidssoker';
import swaggerDocs from './api/swagger';
import bodyParser from 'body-parser';
import logger, { pinoHttpMiddleware } from './logger';
import config from './config';
import createDependencies from './deps';
import tokenValidation from './middleware/token-validation';
import nivaa4Authentication from './middleware/nivaa4-authentication';
import veilederApi from './api/veileder';
import oppgaveApi from './api/oppgave';
import arbeidssokerregisteretApi from './api/arbeidssokerregisteret/oppslag';
import inngangRoutes from './api/arbeidssokerregisteret/inngang';
import http from 'http';
import tilgjengeligeBekreftelserApi from './api/arbeidssokerregisteret/tilgjengelige-bekreftelser';

const PORT = 3000;
const app = express();
const router = express.Router();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(pinoHttpMiddleware());
app.use(helmet());
app.use(cors({ origin: /\.nav\.no$/, credentials: true }));
app.disable('x-powered-by');
const httpServer = http.createServer(app);

async function setUpRoutes() {
    const { tokenDings, profilRepository, behovRepository, microfrontendToggler } = createDependencies();

    // Public routes
    router.use(swaggerDocs());
    router.use(healhApi());
    router.use(unleashApi());

    // veileder routes - ingen auth middleware
    router.use(veilederApi(await behovRepository));

    // id porten
    // router.use(idportenAuthentication);
    router.use(tokenValidation);

    router.use(arbeidssokerApi());

    // level4
    router.use(nivaa4Authentication);
    router.use(vedtakinfoApi(await tokenDings));
    router.use(dialogRoutes(await tokenDings));
    router.use(profilApi(profilRepository));
    router.use(behovForVeiledningApi(behovRepository, await microfrontendToggler));
    router.use(oppgaveApi(config.OPPGAVE_API_SCOPE));

    router.use('/arbeidssokerregisteret', arbeidssokerregisteretApi(await tokenDings));
    router.use('/arbeidssokerregisteret/inngang', inngangRoutes(await tokenDings));
    router.use(tilgjengeligeBekreftelserApi(await tokenDings));

    app.use(config.BASE_PATH || '', router);
}

const startServer = async () => {
    try {
        await setUpRoutes();
        logger.info(`Starting server...`);
        httpServer.listen(PORT, () => {
            logger.info('Server running at http://localhost:3000');
        });
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
};

startServer();
