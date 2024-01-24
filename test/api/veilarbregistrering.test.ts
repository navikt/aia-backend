import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import veilarbregistrering from '../../src/api/veilarbregistrering';
import { Auth } from '../../src/auth/tokenDings';
import tokenValidation from '../../src/middleware/token-validation';

describe('veilarbregistrering api', () => {
    let tokenDings: Auth;
    beforeAll(() => {
        tokenDings = {
            exchangeIDPortenToken(token: string, targetApp: string) {
                return Promise.resolve({
                    access_token: `x-${token}`,
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
    it('gir 401 hvis request uten auth header', (done) => {
        const app = express();
        app.use(cookieParser());
        app.use(tokenValidation);
        app.use(veilarbregistrering(tokenDings, 'http://localhost:6666'));

        request(app).get('/standard-innsats').expect(401, done);
    });

    it('kaller veilarbregistrering med token i header', async () => {
        const proxyServer = express();
        proxyServer.get('/veilarbregistrering/api/profilering/standard-innsats', (req, res) => {
            if (req.headers['authorization'] === 'Bearer x-token123') {
                res.status(200).send('ok');
            } else {
                res.status(400).end();
            }
        });
        const port = 6676;
        const proxy = proxyServer.listen(port);
        const app = express();
        app.use(cookieParser());
        app.use(veilarbregistrering(tokenDings, `http://localhost:${port}`));

        try {
            const response = await request(app).get('/standard-innsats').set('authorization', 'token123');

            expect(response.statusCode).toEqual(200);
            expect(response.text).toBe('ok');
        } finally {
            proxy.close();
        }
    });

    it('sender med call-id', async () => {
        const proxyServer = express();
        proxyServer.get('/veilarbregistrering/api/profilering/standard-innsats', (req, res) => {
            if (req.header('Nav-Call-Id') === 'call-id-123') {
                res.status(200).end();
            } else {
                res.status(400).end();
            }
        });
        const port = 6675;
        const proxy = proxyServer.listen(port);
        const app = express();
        app.use(cookieParser());
        app.use(veilarbregistrering(tokenDings, `http://localhost:${port}`));

        try {
            const response = await request(app)
                .get('/standard-innsats')
                .set('authorization', 'token123')
                .set('Nav-Call-Id', 'call-id-123');

            expect(response.statusCode).toEqual(200);
        } finally {
            proxy.close();
        }
    });
});
