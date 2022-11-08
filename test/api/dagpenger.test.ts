import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import dagpenger from '../../src/api/dagpenger';
import { setTokenAndUserMock } from '../../src/middleware/set-token-and-user';

jest.mock('../../src/config', () => {
    const config = jest.requireActual('../../src/config');
    return {
        ...config.default,
        NAIS_CLUSTER_NAME: 'test',
    };
});

describe('dagpenger api', () => {
    it('kaller dagpenger-api med token-x i header', async () => {
        const tokenDings = {
            exchangeIDPortenToken: jest.fn().mockReturnValue(Promise.resolve({ access_token: 'tokenX-123' })),
            verifyIDPortenToken: jest.fn().mockReturnValue(Promise.resolve()),
        };

        const proxyServer = express();
        proxyServer.get('/soknad', (req, res) => {
            if (
                req.header('Authorization') === 'Bearer tokenX-123' &&
                req.header('TokenXAuthorization') === 'Bearer tokenX-123'
            ) {
                res.status(200).send('ok');
            } else {
                res.status(400).end();
            }
        });
        const proxy = proxyServer.listen(6667);

        const app = express();
        app.use(cookieParser());
        app.use(setTokenAndUserMock);
        app.use(dagpenger(tokenDings, 'http://localhost:6667'));

        try {
            const response = await request(app)
                .get('/dagpenger/soknad')
                .set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(tokenDings.exchangeIDPortenToken).toBeCalledWith('token123', 'test:teamdagpenger:dp-innsyn');
            expect(response.statusCode).toEqual(200);
            expect(response.text).toBe('ok');
        } finally {
            proxy.close();
        }
    });
});
