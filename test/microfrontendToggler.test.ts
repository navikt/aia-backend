import createMicrofrontendToggler from '../src/microfrontendToggler';
import express from 'express';
import bodyParser from 'body-parser';

jest.mock('../src/config', () => {
    const config = jest.requireActual('../src/config');
    return {
        ...config.default,
        NAIS_CLUSTER_NAME: 'test-gcp',
    };
});

const createApi = (spyFn: jest.Mock, statusCode = 204) => {
    const server = express();
    server.use(bodyParser.json());

    server.post('/api/v1/microfrontend-toggle', (req, res) => {
        //console.log('REQ.body', req.body);
        spyFn(req.body);
        res.status(statusCode).end();
    });
    return server;
};

describe('microfrontendToggler', () => {
    it('kjører token-x', async () => {
        const tokenDings = {
            exchangeIDPortenToken: jest.fn().mockReturnValue(Promise.resolve({ access_token: `tokenX` })),
        };
        const api = createApi(jest.fn());
        const server = api.listen(9812);
        const toggler = await createMicrofrontendToggler(Promise.resolve(tokenDings), 'http://localhost:9812');

        try {
            await toggler.toggle('disable', 'test', 'token');
            expect(tokenDings.exchangeIDPortenToken).toHaveBeenCalledWith(
                'token',
                'test-gcp:paw:paw-microfrontend-toggler',
            );
        } finally {
            server.close();
        }
    });

    it('poster action og microfrontendId', async () => {
        const tokenDings = {
            exchangeIDPortenToken: jest.fn().mockReturnValue(Promise.resolve({ access_token: `tokenX` })),
        };
        const spy = jest.fn();
        const api = createApi(spy);
        const server = api.listen(9813);
        const toggler = await createMicrofrontendToggler(Promise.resolve(tokenDings), 'http://localhost:9813');

        try {
            await toggler.toggle('disable', 'test', 'token');
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenLastCalledWith({ '@action': 'disable', microfrontend_id: 'test' });
        } finally {
            server.close();
        }
    });

    it('kaster feil ved feil fra api', async () => {
        const tokenDings = {
            exchangeIDPortenToken: jest.fn().mockReturnValue(Promise.resolve({ access_token: `tokenX` })),
        };
        const api = createApi(jest.fn(), 500);

        const server = api.listen(9814);
        const toggler = await createMicrofrontendToggler(Promise.resolve(tokenDings), 'http://localhost:9814');

        try {
            expect.assertions(1);
            await toggler.toggle('enable', 'test-mf', 'token3');
        } catch (err: any) {
            expect(err.message).toMatch('Request failed with status code 500');
        } finally {
            server.close();
        }
    });
});
