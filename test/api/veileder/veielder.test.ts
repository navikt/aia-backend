import express from 'express';
import request from 'supertest';
import veilederApi from '../../../src/api/veileder';
import bodyParser from 'body-parser';
import { BehovRepository } from '../../../src/db/behovForVeiledningRepository';

describe('veileder api', () => {
    describe('POST /veileder/besvarelse', () => {
        it('proxy kaller besvarelse', async () => {
            const proxyServer = express();
            const spy = jest.fn();

            proxyServer.post('/api/v1/veileder/besvarelse', (req, res) => {
                spy();
                res.status(200).end();
            });

            const port = 6169;
            const proxy = proxyServer.listen(port);

            const app = express();
            app.use(veilederApi({} as any, `http://localhost:${port}`));

            try {
                await request(app).post('/veileder/besvarelse').expect(200);
                expect(spy).toHaveBeenCalled();
            } finally {
                proxy.close();
            }
        });
    });

    describe.skip('POST /veileder/behov-for-veiledning', () => {
        let behovRepository: BehovRepository, app: any;
        beforeEach(() => {
            app = express();
            app.use(bodyParser.json());
            behovRepository = {
                lagreBehov: jest.fn(),
                hentBehov: jest.fn().mockReturnValue(
                    Promise.resolve({
                        oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                        created_at: 'test-dato',
                        dialog_id: 'dialog-id',
                    }),
                ),
            };
        });
        it('returnerer 400 hvis ikke foedselsnummer i request', async () => {
            app.use(veilederApi(behovRepository));

            const response = await request(app).post('/veileder/behov-for-veiledning');

            expect(response.statusCode).toEqual(400);
        });

        it('returnerer 401 hvis ingen tilgang', async () => {
            const proxyServer = express();
            const spy = jest.fn();

            proxyServer.post('/api/v1/veileder/har-tilgang', (req, res) => {
                spy();
                res.status(401).end();
            });

            const port = 6173;
            const proxy = proxyServer.listen(port);
            app.use(veilederApi(behovRepository, `http://localhost:${port}`));

            try {
                const response = await request(app)
                    .post('/veileder/behov-for-veiledning')
                    .send({ foedselsnummer: '666' });

                expect(response.statusCode).toEqual(401);
                expect(spy).toHaveBeenCalled();
            } finally {
                proxy.close();
            }
        });

        it('returnerer behov for bruker', async () => {
            const proxyServer = express();

            proxyServer.post('/api/v1/veileder/har-tilgang', (req, res) => {
                res.status(200).end();
            });

            const port = 6174;
            const proxy = proxyServer.listen(port);

            app.use(veilederApi(behovRepository, `http://localhost:${port}`));

            try {
                const response = await request(app)
                    .post('/veileder/behov-for-veiledning')
                    .send({ foedselsnummer: '666' });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({
                    oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                    dato: 'test-dato',
                    dialogId: 'dialog-id',
                    tekster: {
                        sporsmal: 'Hva slags veiledning ønsker du?',
                        svar: {
                            STANDARD_INNSATS: 'Jeg ønsker å klare meg selv',
                            SITUASJONSBESTEMT_INNSATS: 'Jeg ønsker oppfølging fra NAV',
                        },
                    },
                });
            } finally {
                proxy.close();
            }
        });

        it('returnerer 204 hvis ingen behov i db', async () => {
            const proxyServer = express();

            proxyServer.post('/api/v1/veileder/har-tilgang', (req, res) => {
                res.status(200).end();
            });

            const port = 6175;
            const proxy = proxyServer.listen(port);

            behovRepository.hentBehov = jest.fn().mockReturnValue(Promise.resolve(null));

            app.use(veilederApi(behovRepository, `http://localhost:${port}`));

            try {
                const response = await request(app)
                    .post('/veileder/behov-for-veiledning')
                    .send({ foedselsnummer: '666' });

                expect(response.statusCode).toEqual(204);
            } finally {
                proxy.close();
            }
        });
    });
});
