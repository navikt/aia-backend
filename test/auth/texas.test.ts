import express from 'express';
import { requestTexasAzureM2MToken, requestTexasAzureOboToken, requestTexasOboToken } from '../../src/auth/texas';

describe('texas', () => {
    beforeAll(() => {
        process.env.NAIS_TOKEN_EXCHANGE_ENDPOINT = 'http://localhost:6767';
        process.env.NAIS_TOKEN_ENDPOINT = 'http://localhost:7676';
    });
    describe('requestTexasOboToken', () => {
        test('veksler token via texas', async () => {
            const spy = jest.fn();
            const mockServer = express();
            mockServer.use(express.json());
            mockServer.post('/', (req, res) => {
                spy(req.body);
                res.json({ access_token: 'access_token 123' });
            });
            const server = mockServer.listen(6767);

            try {
                const result = await requestTexasOboToken(
                    'token',
                    'dev-gcp:paw:paw-arbeidssoekerregisteret-api-oppslag',
                );

                expect(result.ok).toBe(true);
                expect(result.ok && result.token).toEqual('access_token 123');
                expect(spy).toHaveBeenCalledWith({
                    identity_provider: 'tokenx',
                    target: 'dev-gcp:paw:paw-arbeidssoekerregisteret-api-oppslag',
                    user_token: 'token',
                });
            } finally {
                server.close();
            }
        });

        test('returnerer ok:false ved feil fra texas', async () => {
            const mockServer = express();
            mockServer.use(express.json());
            mockServer.post('/', (req, res) => {
                res.status(400).end();
            });

            const server = mockServer.listen(6767);

            try {
                const result = await requestTexasOboToken(
                    'token',
                    'dev-gcp:paw:paw-arbeidssoekerregisteret-api-oppslag',
                );
                expect(result.ok).toBe(false);
            } finally {
                server.close();
            }
        });
    });
    describe('requestTexasAzureOboToken', () => {
        test('veksler token via texas', async () => {
            const spy = jest.fn();
            const mockServer = express();
            mockServer.use(express.json());
            mockServer.post('/', (req, res) => {
                spy(req.body);
                res.json({ access_token: 'access_token 456' });
            });
            const server = mockServer.listen(6767);

            try {
                const result = await requestTexasAzureOboToken(
                    'token',
                    'api://dev-gcp.paw.paw-arbeidssoekerregisteret-api-oppslag/.default',
                );

                expect(result.ok).toBe(true);
                expect(result.ok && result.token).toEqual('access_token 456');
                expect(spy).toHaveBeenCalledWith({
                    identity_provider: 'azuread',
                    target: 'api://dev-gcp.paw.paw-arbeidssoekerregisteret-api-oppslag/.default',
                    user_token: 'token',
                });
            } finally {
                server.close();
            }
        });
    });
    describe('requestTexasAzureM2MToken', () => {
        test('henter token via texas', async () => {
            const spy = jest.fn();
            const mockServer = express();
            mockServer.use(express.json());
            mockServer.post('/', (req, res) => {
                spy(req.body);
                res.json({ access_token: 'access_token m2m' });
            });
            const server = mockServer.listen(7676);

            try {
                const result = await requestTexasAzureM2MToken(
                    'api://dev-gcp.paw.paw-arbeidssoekerregisteret-api-oppslag/.default',
                );

                expect(result.ok).toBe(true);
                expect(result.ok && result.token).toEqual('access_token m2m');
                expect(spy).toHaveBeenCalledWith({
                    identity_provider: 'azuread',
                    target: 'api://dev-gcp.paw.paw-arbeidssoekerregisteret-api-oppslag/.default',
                });
            } finally {
                server.close();
            }
        });
    });
});
