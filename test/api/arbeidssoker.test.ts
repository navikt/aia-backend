import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import arbeidssoker, { filtrerUtGamleArbeidssokerPerioder } from '../../src/api/arbeidssoker';
import { Auth } from '../../src/auth/tokenDings';
import tokenValidation from '../../src/middleware/token-validation';
import { plussDager } from '../../src/lib/date-utils';

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
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            request(app).get('/arbeidssoker').expect(401, done);
        });

        it('returnerer perioder og under–oppfolging', async () => {
            const proxyServer = getProxyServer();
            const proxy = proxyServer.listen(7666);

            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
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
            const proxy = proxyServer.listen(7666);

            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            try {
                const response = await request(app).get('/er-arbeidssoker').set('authorization', 'token123');
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ erArbeidssoker: true, erStandard: true });
            } finally {
                proxy.close();
            }
        });

        it('returnerer false når ikke underoppfolging og tom periode', async () => {
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
            const proxy = proxyServer.listen(7666);

            const app = express();
            app.use(cookieParser());
            app.use(bodyParser.json());
            app.use(arbeidssoker(tokenDings, 'http://localhost:7666', 'http://localhost:7666', 'dev-gcp'));

            try {
                const response = await request(app).get('/er-arbeidssoker').set('authorization', 'token123');
                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ erArbeidssoker: false, erStandard: false });
            } finally {
                proxy.close();
            }
        });
    });
});
