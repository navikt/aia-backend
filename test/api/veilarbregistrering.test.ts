import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import veilarbregistrering from '../../src/api/veilarbregistrering';
import idportenAuthMock from './idportenAuthMock';

describe('veilarbregistrering api', () => {
    it('gir 401 hvis request uten selvbetjening-id cookie', (done) => {
        const app = express();
        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.use(veilarbregistrering('http://localhost:6666'));

        request(app).get('/registrering').expect(401, done);
    });

    it('kaller veilarbregistrering med token i header', async () => {
        const proxyServer = express();
        proxyServer.get('/veilarbregistrering/api/registrering', (req, res) => {
            if (req.headers['authorization'] === 'Bearer token123') {
                res.status(200).send('ok');
            } else {
                res.status(400).end();
            }
        });
        const port = 6676;
        const proxy = proxyServer.listen(port);
        const app = express();
        app.use(cookieParser());
        app.use(idportenAuthMock);
        app.use(veilarbregistrering(`http://localhost:${port}`));

        try {
            const response = await request(app).get('/registrering').set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(response.statusCode).toEqual(200);
            expect(response.text).toBe('ok');
        } finally {
            proxy.close();
        }
    });

    it('sender med call-id', async () => {
        const proxyServer = express();
        proxyServer.get('/veilarbregistrering/api/registrering', (req, res) => {
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
        app.use(idportenAuthMock);
        app.use(veilarbregistrering(`http://localhost:${port}`));

        try {
            const response = await request(app)
                .get('/registrering')
                .set('Cookie', ['selvbetjening-idtoken=token123;'])
                .set('Nav-Call-Id', 'call-id-123');

            expect(response.statusCode).toEqual(200);
        } finally {
            proxy.close();
        }
    });
});
