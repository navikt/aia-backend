import { beforeAll, describe, expect, it } from 'vitest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import bodyParser from 'body-parser';
import { ValidatedRequest } from '../../../src/middleware/token-validation';
import inngangRoutes from '../../../src/api/arbeidssokerregisteret/inngang';
import { Auth } from '../../../src/auth/tokenDings';
import request from 'supertest';

const getProxyServer = (
    spyFn: jest.Mock<any, any, any>,
    statusCode = 204,
    body: Record<string, string> | undefined = undefined,
) => {
    const proxyServer = express();
    proxyServer.use(bodyParser.json());
    proxyServer.post('/api/v1/arbeidssoker/opplysninger', (req, res) => {
        spyFn(req.body);
        res.status(statusCode).json(body);
    });
    return proxyServer;
};
describe('arbeidssøkerregisteret/inngangs-api', () => {
    let tokenDings: Auth;
    beforeAll(() => {
        tokenDings = {
            exchangeIDPortenToken(token: string) {
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

    describe('POST opplysninger', () => {
        it('proxyer kall og legger til identitetsnummer fra request i body', async () => {
            const spy = vi.fn();
            const proxyServer = getProxyServer(spy);
            const proxy = proxyServer.listen(7666);

            const app = express();
            app.use(bodyParser.json());
            app.use((req, _, next) => {
                (req as ValidatedRequest).user = {
                    fnr: '1234566789',
                    ident: '',
                    level: 'Level4',
                };
                next();
            });
            app.use(inngangRoutes(tokenDings, 'http://localhost:7666'));

            try {
                const response = await request(app)
                    .post('/v1/arbeidssoker/opplysninger')
                    .set('authorization', 'token123')
                    .send({
                        jobbsituasjon: [
                            {
                                beskrivelse: 'KONKURS',
                            },
                        ],
                    });
                expect(response.statusCode).toEqual(204);
                expect(spy).toHaveBeenCalledWith({
                    identitetsnummer: '1234566789',
                    jobbsituasjon: [
                        {
                            beskrivelse: 'KONKURS',
                        },
                    ],
                });
            } finally {
                proxy.close();
            }
        });

        it('håndterer feil', async () => {
            const proxyServer = getProxyServer(vi.fn(), 400, { test: 'noe gikk galt' });
            const proxy = proxyServer.listen(8666);

            const app = express();
            app.use(bodyParser.json());
            app.use((req, _, next) => {
                (req as ValidatedRequest).user = {
                    fnr: '1234566789',
                    ident: '',
                    level: 'Level4',
                };
                next();
            });
            app.use(inngangRoutes(tokenDings, 'http://localhost:8666'));

            try {
                const response = await request(app)
                    .post('/v1/arbeidssoker/opplysninger')
                    .set('authorization', 'token123')
                    .send({ foo: 'bar' });
                expect(response.statusCode).toEqual(400);
            } finally {
                proxy.close();
            }
        });
    });
});
