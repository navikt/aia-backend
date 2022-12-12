import express from 'express';
import cookieParser from 'cookie-parser';
import meldekort from '../../src/api/meldekort';
import request from 'supertest';
import idportenAuthMock from './idportenAuthMock';

jest.mock('../../src/config', () => {
    const config = jest.requireActual('../../src/config');
    return {
        ...config.default,
        NAIS_CLUSTER_NAME: 'test',
        MELDEKORT_APP_NAME: 'meldekort-api-test',
    };
});

describe('meldekort api', () => {
    it('kaller meldekort-api med token-x i header', async () => {
        const tokenDings = {
            exchangeIDPortenToken: jest.fn().mockReturnValue(Promise.resolve({ access_token: 'tokenX-123' })),
        };

        const proxyServer = express();
        proxyServer.get('/meldekort', (req, res) => {
            if (
                req.header('Authorization') === undefined &&
                req.header('TokenXAuthorization') === 'Bearer tokenX-123'
            ) {
                res.status(200).send('ok');
            } else {
                res.status(400).end();
            }
        });

        const proxy = proxyServer.listen(6669);

        const app = express();
        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.use(meldekort(tokenDings, 'http://localhost:6669'));

        try {
            const response = await request(app).get('/meldekort').set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(tokenDings.exchangeIDPortenToken).toBeCalledWith('token123', 'test:meldekort:meldekort-api-test');
            expect(response.statusCode).toEqual(200);
            expect(response.text).toBe('ok');
        } finally {
            proxy.close();
        }
    });
});
