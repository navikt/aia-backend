import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import arbeidssoker from '../../src/api/arbeidssoker';
import idportenAuthentication from '../../src/middleware/idporten-authentication';
import { Auth } from '../../src/auth/tokenDings';

function getProxyServer() {
    const proxyServer = express();
    proxyServer.get('/veilarbregistrering/api/arbeidssoker/perioder/niva3', (req, res) => {
        if (req.headers['authorization'] === 'Bearer token123') {
            res.send({ arbeidssokerperioder: [{ fraOgMed: '2022-01-01' }] });
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
            app.use(idportenAuthentication);
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
            app.use(idportenAuthentication);
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
                expect(response.body).toEqual({ erArbeidssoker: true });
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
                expect(response.body).toEqual({ erArbeidssoker: false });
            } finally {
                proxy.close();
            }
        });
    });
});
