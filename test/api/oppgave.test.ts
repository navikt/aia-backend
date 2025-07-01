import express from 'express';
import bodyParser from 'body-parser';
import { mockAuthMiddleware } from './behovForVeiledning.test';
import { createOppgaveRoutes } from '../../src/api/oppgave';
import request from 'supertest';

describe('oppgave api', () => {
    it('poster til oppgave api', async () => {
        const bodySpy = jest.fn();
        const oppgaveServer = express();
        oppgaveServer.use(bodyParser.json());
        oppgaveServer.post('/api/v1/oppgaver', (req, res) => {
            bodySpy(req.body);
            res.status(201).end();
        });

        const oppgaveMock = oppgaveServer.listen(9898);

        const getAzureAdToken = jest.fn().mockReturnValue(Promise.resolve({ ok: true, token: 'token-123' }));
        const oppgaveUrl = 'http://localhost:9898';

        const app = express();
        app.use(bodyParser.json());
        app.use(mockAuthMiddleware);
        app.use(createOppgaveRoutes(getAzureAdToken)('', oppgaveUrl));

        try {
            const response = await request(app).post('/oppgave').send({ beskrivelse: 'beskrivelse' });

            expect(response.statusCode).toEqual(201);
            expect(bodySpy).toHaveBeenCalledTimes(1);
            const requestBody = bodySpy.mock.calls[0][0];
            expect(requestBody).toEqual({
                personident: 'test-fnr',
                beskrivelse: 'beskrivelse',
                tildeltEnhetsnr: '4450',
                tema: 'DAG',
                oppgavetype: 'VURD_HENV',
                aktivDato: new Date().toISOString().substring(0, 10),
                prioritet: 'NORM',
            });
        } finally {
            oppgaveMock.close();
        }
    });

    it('poster til oppgave api med høy prioritet og korrekt type', async () => {
        const bodySpy = jest.fn();
        const oppgaveServer = express();
        oppgaveServer.use(bodyParser.json());
        oppgaveServer.post('/api/v1/oppgaver', (req, res) => {
            bodySpy(req.body);
            res.status(201).end();
        });

        const oppgaveMock = oppgaveServer.listen(9898);

        const getAzureAdToken = jest.fn().mockReturnValue(Promise.resolve({ ok: true, token: 'token-123' }));
        const oppgaveUrl = 'http://localhost:9898';

        const app = express();
        app.use(bodyParser.json());
        app.use(mockAuthMiddleware);
        app.use(createOppgaveRoutes(getAzureAdToken)('', oppgaveUrl));

        try {
            const response = await request(app)
                .post('/oppgave')
                .send({ beskrivelse: 'beskrivelse', dinSituasjon: 'OPPSIGELSE' });

            expect(response.statusCode).toEqual(201);
            expect(bodySpy).toHaveBeenCalledTimes(1);
            const requestBody = bodySpy.mock.calls[0][0];
            expect(requestBody).toEqual({
                personident: 'test-fnr',
                beskrivelse: 'beskrivelse',
                tildeltEnhetsnr: '4450',
                tema: 'DAG',
                oppgavetype: 'VUR_KONS_YTE',
                aktivDato: new Date().toISOString().substring(0, 10),
                prioritet: 'HOY',
            });
        } finally {
            oppgaveMock.close();
        }
    });

    it('poster til oppgave api til annet kontor ved KONKURS', async () => {
        const bodySpy = jest.fn();
        const oppgaveServer = express();
        oppgaveServer.use(bodyParser.json());
        oppgaveServer.post('/api/v1/oppgaver', (req, res) => {
            bodySpy(req.body);
            res.status(201).end();
        });

        const oppgaveMock = oppgaveServer.listen(9898);

        const getAzureAdToken = jest.fn().mockReturnValue(Promise.resolve({ ok: true, token: 'token-123' }));
        const oppgaveUrl = 'http://localhost:9898';

        const app = express();
        app.use(bodyParser.json());
        app.use(mockAuthMiddleware);
        app.use(createOppgaveRoutes(getAzureAdToken)('', oppgaveUrl));

        try {
            const response = await request(app)
                .post('/oppgave')
                .send({ beskrivelse: 'beskrivelse', dinSituasjon: 'KONKURS' });

            expect(response.statusCode).toEqual(201);
            expect(bodySpy).toHaveBeenCalledTimes(1);
            const requestBody = bodySpy.mock.calls[0][0];
            expect(requestBody).toEqual({
                personident: 'test-fnr',
                beskrivelse: 'beskrivelse',
                tildeltEnhetsnr: '4401',
                tema: 'DAG',
                oppgavetype: 'VUR_KONS_YTE',
                aktivDato: new Date().toISOString().substring(0, 10),
                prioritet: 'HOY',
            });
        } finally {
            oppgaveMock.close();
        }
    });

    it('poster med azure ad token og correlation-id i header', async () => {
        const headersSpy = jest.fn();
        const oppgaveServer = express();
        oppgaveServer.use(bodyParser.json());
        oppgaveServer.post('/api/v1/oppgaver', (req, res) => {
            headersSpy(req.headers);
            res.status(201).end();
        });

        const oppgaveMock = oppgaveServer.listen(9897);

        const getAzureAdToken = jest.fn().mockReturnValue(Promise.resolve({ ok: true, token: 'ad-token' }));
        const oppgaveUrl = 'http://localhost:9897';

        const app = express();
        app.use(bodyParser.json());
        app.use(mockAuthMiddleware);
        app.use(createOppgaveRoutes(getAzureAdToken)('scope', oppgaveUrl));

        try {
            const response = await request(app).post('/oppgave').send({ beskrivelse: 'beskrivelse' });

            expect(getAzureAdToken).toHaveBeenCalledWith('scope');
            expect(response.statusCode).toEqual(201);
            expect(headersSpy).toHaveBeenCalledTimes(1);
            const headers = headersSpy.mock.calls[0][0];
            expect(headers['authorization']).toEqual('Bearer ad-token');
            expect(headers['x-correlation-id']).toBeDefined();
        } finally {
            oppgaveMock.close();
        }
    });

    it('handterer feil', async () => {
        const oppgaveServer = express();
        oppgaveServer.use(bodyParser.json());
        oppgaveServer.post('/api/v1/oppgaver', (req, res) => {
            res.status(500).end();
        });
        const oppgaveMock = oppgaveServer.listen(9896);
        const getAzureAdToken = jest.fn().mockReturnValue(Promise.resolve({ ok: true, token: 'token-123' }));
        const oppgaveUrl = 'http://localhost:9896';

        const app = express();
        app.use(bodyParser.json());
        app.use(mockAuthMiddleware);
        app.use(createOppgaveRoutes(getAzureAdToken)('', oppgaveUrl));

        try {
            const response = await request(app).post('/oppgave').send({ beskrivelse: 'beskrivelse' });
            expect(response.statusCode).toEqual(500);
        } finally {
            oppgaveMock.close();
        }
    });
});
