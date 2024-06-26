import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import arbeidssoker, { filtrerUtGamleArbeidssokerPerioder } from '../../src/api/arbeidssoker';
import { Auth } from '../../src/auth/tokenDings';
import tokenValidation, { ValidatedRequest } from '../../src/middleware/token-validation';
import { plussDager } from '../../src/lib/date-utils';

let isEnabledMock: jest.Mock;

function isEnabled() {
    return isEnabledMock();
}

jest.mock('unleash-client', () => {
    return {
        isEnabled,
    };
});

function getProxyServer() {
    const proxyServer = express();
    proxyServer.get('/veilarbregistrering/api/arbeidssoker/perioder/niva3', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send({ arbeidssokerperioder: [{ fraOgMed: '2022-01-01' }] });
        } else {
            res.status(400).end();
        }
    });
    proxyServer.get('/veilarbregistrering/api/profilering/standard-innsats', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send(true);
        } else {
            res.status(400).end();
        }
    });
    proxyServer.get('/veilarboppfolging/api/niva3/underoppfolging', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send({ underOppfolging: true });
        } else {
            res.status(400).end();
        }
    });
    return proxyServer;
}

function getProxyServerIkkeArbeidssoker() {
    const proxyServer = express();
    proxyServer.get('/veilarbregistrering/api/arbeidssoker/perioder/niva3', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send({ arbeidssokerperioder: [] });
        } else {
            res.status(400).end();
        }
    });
    proxyServer.get('/veilarboppfolging/api/niva3/underoppfolging', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send({ underOppfolging: false });
        } else {
            res.status(400).end();
        }
    });
    proxyServer.get('/veilarbregistrering/api/profilering/standard-innsats', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send(false);
        } else {
            res.status(400).end();
        }
    });
    return proxyServer;
}
describe('filtrerArbeidssokerPerioder', () => {
    it('filtrerer ut perioder eldre enn 30 dager', () => {
        const tilOgMedDato = plussDager(new Date(), -31).toISOString().substring(0, 10);
        const result = filtrerUtGamleArbeidssokerPerioder([
            { fraOgMedDato: '2023-09-09', tilOgMedDato },
            { fraOgMedDato: '2023-10-01', tilOgMedDato: plussDager(new Date(), -1).toISOString().substring(0, 10) },
        ]);

        expect(result.length).toEqual(1);
        expect(result[0].fraOgMedDato).toEqual('2023-10-01');
    });
    it('beholder åpne perioder', () => {
        const perioder = [{ fraOgMedDato: '2023-10-04', tilOgMedDato: null }];
        expect(filtrerUtGamleArbeidssokerPerioder(perioder)).toEqual(perioder);
    });
});
describe('arbeidssoker api', () => {
    let tokenDings: Auth;
    beforeAll(() => {
        isEnabledMock = jest.fn().mockReturnValue(false);
        tokenDings = {
            exchangeIDPortenToken(token: string, targetApp: string) {
                return Promise.resolve({
                    access_token: token,
                    expired() {
                        return false;
                    },
                    claims() {
                        return {
                            aud: 'test',
                            exp: 0,
                            iat: 0,
                            iss: 'test',
                            sub: 'test',
                        };
                    },
                });
            },
        };
    });

    describe('/arbeidssoker', () => {
        it('returnerer 401 når token mangler', (done) => {
            const app = express();
            app.use(cookieParser());
            app.use(tokenValidation);
            app.use((req, _, next) => {
                (req as ValidatedRequest).user = {
                    fnr: '',
                    ident: '',
                    level: 'Level3',
                };
                next();
            });
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            request(app).get('/arbeidssoker').expect(401, done);
        });

        it('returnerer 403 når level3', (done) => {
            const app = express();
            app.use(cookieParser());
            app.use(tokenValidation);
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            request(app).get('/arbeidssoker').expect(401, done);
        });

        it('returnerer perioder og under-oppfolging', async () => {
            const proxyServer = getProxyServer();
            const proxy = proxyServer.listen(7666);

            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
            app.use((req, _, next) => {
                (req as ValidatedRequest).user = {
                    fnr: '',
                    ident: '',
                    level: 'Level4',
                };
                next();
            });
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            try {
                const response = await request(app).get('/arbeidssoker').set('authorization', 'token123');
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({
                    underoppfolging: {
                        status: 200,
                        underoppfolging: true,
                    },
                    arbeidssokerperioder: {
                        status: 200,
                        arbeidssokerperioder: [{ fraOgMed: '2022-01-01' }],
                    },
                });
            } finally {
                proxy.close();
            }
        });
    });

    describe('/er-arbeidssoker', () => {
        it('returnerer 401 når token mangler', (done) => {
            const app = express();
            app.use(cookieParser());
            app.use(tokenValidation);
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            request(app).get('/er-arbeidssoker').expect(401, done);
        });

        it('returnerer true når underoppfolging ELLER ikke tom perioder', async () => {
            const proxyServer = getProxyServer();
            const proxy = proxyServer.listen(7667);

            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
            app.use((req, _, next) => {
                (req as ValidatedRequest).user = {
                    fnr: '',
                    ident: '',
                    level: 'Level4',
                };
                next();
            });
            app.use(arbeidssoker(tokenDings, 'http://localhost:7667', 'http://localhost:7667', 'dev-gcp'));

            try {
                const response = await request(app).get('/er-arbeidssoker').set('authorization', 'token123');
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ erArbeidssoker: true, erStandard: true, brukNyAia: false });
            } finally {
                proxy.close();
            }
        });

        it('returnerer false når level3', async () => {
            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
            app.use((req, _, next) => {
                (req as ValidatedRequest).user = {
                    fnr: '',
                    ident: '',
                    level: 'Level3',
                };
                next();
            });
            app.use(arbeidssoker(tokenDings, '', '', 'dev-gcp'));

            const response = await request(app).get('/er-arbeidssoker').set('authorization', 'token123');
            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ erArbeidssoker: false, erStandard: false, brukNyAia: false });
        });

        it('returnerer false når ikke underoppfolging og tom periode', async () => {
            const proxyServer = getProxyServerIkkeArbeidssoker();
            const proxy = proxyServer.listen(7668);

            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
            app.use(arbeidssoker(tokenDings, 'http://localhost:7668', 'http://localhost:7668', 'dev-gcp'));

            try {
                const response = await request(app).get('/er-arbeidssoker').set('authorization', 'token123');
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ erArbeidssoker: false, erStandard: false, brukNyAia: false });
            } finally {
                proxy.close();
            }
        });

        describe('nytt arbeidssokerregister', () => {
            beforeAll(() => {
                isEnabledMock.mockReturnValue(true);
            });

            it('returnerer false når togglet på', async () => {
                const app = express();
                app.use(cookieParser());
                app.use(bodyParser.json());
                app.use((req, _, next) => {
                    (req as ValidatedRequest).user = {
                        fnr: '',
                        ident: '',
                        level: 'Level4',
                    };
                    next();
                });
                app.use(arbeidssoker(tokenDings, 'http://localhost:9666', 'http://localhost:9666', 'dev-gcp'));

                const response = await request(app).get('/er-arbeidssoker').set('authorization', 'token123');
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ erArbeidssoker: false, erStandard: false, brukNyAia: false });
            });
        });
    });
});
