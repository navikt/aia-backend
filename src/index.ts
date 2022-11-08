import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import setTokenAndUser from './middleware/set-token-and-user';
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
import bodyParser from 'body-parser';
import logger, { customRequestLogMessage } from './logger';
import config from './config';
import createDependencies from './deps';
import Config from './config';

const PORT = 3000;
const app = express();
const router = express.Router();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
    pinoHttp({
        autoLogging: {
            ignore: (req) => (req.url ? /internal/.test(req.url) : false),
        },
        customLogLevel: (_, res, err) => (res.statusCode >= 400 || err ? 'error' : 'info'),
        logger,
        customSuccessMessage: customRequestLogMessage,
        customErrorMessage: customRequestLogMessage,
        customProps: (req) => ({
            x_callId: req.headers['nav-call-id'],
            x_consumerId: req.headers[Config.CONSUMER_ID_HEADER_NAME],
        }),
    })
);
app.use(helmet());
app.use(cors());
app.disable('x-powered-by');
app.use(setTokenAndUser);

async function setUpRoutes() {
    const { tokenDings, profilRepository, behovRepository } = createDependencies();

    router.use(healhApi());
    router.use(unleashApi());
    router.use(ptoProxyApi());
    router.use(veilarbregistreringApi());
    router.use(swaggerDocs());
    router.use(arbeidssokerApi());
    router.use((await tokenDings).verifyIDPortenToken);
    router.use(dagpengerApi(await tokenDings));
    router.use(meldekortApi(await tokenDings));
    router.use(profilApi(profilRepository));
    router.use(behovForVeiledningApi(behovRepository));
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
