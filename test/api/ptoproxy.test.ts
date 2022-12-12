import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import ptoproxy from '../../src/api/ptoproxy';
import idportenAuthMock from './idportenAuthMock';

describe('ptoproxy api', () => {
    it('gir 401 hvis request uten selvbetjening-id cookie', (done) => {
        const app = express();
        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.use(ptoproxy('http://localhost:6666'));

        request(app).get('/oppfolging').expect(401, done);
    });

    it('kaller pto-proxty med token i header', async () => {
        const proxyServer = express();
        proxyServer.get('/veilarboppfolging/api/oppfolging', (req, res) => {
            if (req.headers['authorization'] === 'Bearer token123') {
                res.status(200).send('ok');
            } else {
                res.status(400).end();
            }
        });
        const proxy = proxyServer.listen(6666);
        const app = express();
        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.use(ptoproxy('http://localhost:6666'));

        try {
            const response = await request(app).get('/oppfolging').set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(response.statusCode).toEqual(200);
            expect(response.text).toBe('ok');
        } finally {
            proxy.close();
        }
    });

    it('sender med call-id', async () => {
        const proxyServer = express();
        proxyServer.get('/veilarboppfolging/api/oppfolging', (req, res) => {
            if (req.header('Nav-Call-Id') === 'call-id-123') {
                res.status(200).end();
            } else {
                res.status(400).end();
            }
        });
        const proxy = proxyServer.listen(6665);
        const app = express();
        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.use(ptoproxy('http://localhost:6665'));

        try {
            const response = await request(app)
                .get('/oppfolging')
                .set('Cookie', ['selvbetjening-idtoken=token123;'])
                .set('Nav-Call-Id', 'call-id-123');

            expect(response.statusCode).toEqual(200);
        } finally {
            proxy.close();
        }
    });
});
