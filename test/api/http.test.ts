import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { proxyHttpCall } from '../../src/http';
import idportenAuthMock from './idportenAuthMock';

describe('proxyHttpCall', () => {
    it('kaller feilede requester på nytt angitte ganger', async () => {
        const proxyServer = express();
        const spy = jest.fn();

        proxyServer.get('/test-retry', (req, res) => {
            spy();
            res.status(500).end();
        });

        const port = 6262;
        const proxy = proxyServer.listen(port);
        const app = express();

        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.get('/test', proxyHttpCall(`http://localhost:${port}/test-retry`, { maxRetries: 2 }));

        try {
            const response = await request(app).get('/test').set('Cookie', ['selvbetjening-idtoken=token123;']);
            expect(response.statusCode).toEqual(500);
            expect(spy).toHaveBeenCalledTimes(3);
        } finally {
            proxy.close();
        }
    });

    it('kaller ikke feilede requester på nytt når man opter ut', async () => {
        const proxyServer = express();
        const spy = jest.fn();

        proxyServer.get('/test-retry', (req, res) => {
            spy();
            res.status(500).end();
        });

        const port = 6263;
        const proxy = proxyServer.listen(port);
        const app = express();

        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.get('/test', proxyHttpCall(`http://localhost:${port}/test-retry`, { skipRetry: true }));

        try {
            const response = await request(app).get('/test').set('Cookie', ['selvbetjening-idtoken=token123;']);
            expect(response.statusCode).toEqual(500);
            expect(spy).toHaveBeenCalledTimes(1);
        } finally {
            proxy.close();
        }
    });
});
