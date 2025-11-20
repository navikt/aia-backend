import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { proxyHttpCall, proxyTokenXCall } from '../../src/http';

describe('proxyHttpCall', () => {
    it('kaller feilede requester på nytt angitte ganger', async () => {
        const proxyServer = express();
        const spy = vi.fn();

        proxyServer.get('/test-retry', (req, res) => {
            spy();
            res.status(500).end();
        });

        const port = 6262;
        const proxy = proxyServer.listen(port);
        const app = express();

        app.get('/test', proxyHttpCall(`http://localhost:${port}/test-retry`, { maxRetries: 2 }));

        try {
            const response = await request(app).get('/test');
            expect(response.statusCode).toEqual(500);
            expect(spy).toHaveBeenCalledTimes(3);
        } finally {
            proxy.close();
        }
    });

    it('kaller ikke feilede requester på nytt når man opter ut', async () => {
        const proxyServer = express();
        const spy = vi.fn();

        proxyServer.get('/test-retry', (req, res) => {
            spy();
            res.status(500).end();
        });

        const port = 6263;
        const proxy = proxyServer.listen(port);
        const app = express();

        app.get('/test', proxyHttpCall(`http://localhost:${port}/test-retry`, { skipRetry: true }));

        try {
            const response = await request(app).get('/test');
            expect(response.statusCode).toEqual(500);
            expect(spy).toHaveBeenCalledTimes(1);
        } finally {
            proxy.close();
        }
    });
});

describe('proxyTokenXCall', () => {
    it('returnere 500 hvis getTokenXHeaders-kall feiler', async () => {
        const proxyServer = express();
        const spy = vi.fn();
        proxyServer.get('/test-server', (req, res) => {
            spy();
            res.status(200).end();
        });

        const port = 6264;
        const proxy = proxyServer.listen(port);
        const app = express();

        const getTokenXHeaders = vi.fn().mockRejectedValueOnce('feil');
        app.get(
            '/test',
            proxyTokenXCall(`http://localhost:${port}/test-server`, getTokenXHeaders, { skipRetry: true }),
        );

        try {
            const response = await request(app).get('/test');
            expect(spy).toHaveBeenCalledTimes(0);
            expect(response.statusCode).toEqual(500);
        } finally {
            proxy.close();
        }
    });
});
