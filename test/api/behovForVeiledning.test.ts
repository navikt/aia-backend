import request from 'supertest';
import express, { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import behovForVeiledning from '../../src/api/behovForVeiledning';
import bodyParser from 'body-parser';
import { ValidatedRequest } from '../../src/middleware/token-validation';
import { MicrofrontendToggler } from '../../src/microfrontendToggler';
import { BehovRepository } from '../../src/db/behovForVeiledningRepository';

let isEnabledMock: jest.Mock;

function isEnabled() {
    return isEnabledMock();
}

jest.mock('unleash-client', () => {
    return {
        isEnabled,
    };
});

export const mockAuthMiddleware: RequestHandler = (req, res, next) => {
    (req as ValidatedRequest).user = {
        level: 'Level4',
        ident: 'test-ident',
        fnr: 'test-fnr',
    };
    next();
};

describe('behovForVeiledning API', () => {
    let app: any, microfrontendToggler: MicrofrontendToggler;

    beforeEach(() => {
        app = express();
        app.use(cookieParser());
        app.use(bodyParser.json());
        microfrontendToggler = {
            toggle: jest.fn().mockReturnValue(Promise.resolve()),
        };
        isEnabledMock = jest.fn().mockReturnValue(false);
    });

    describe('GET', () => {
        it('returnerer {oppfolging, dato, dialogId}', async () => {
            const behovRepository = {
                lagreBehov: jest.fn(),
                hentBehov: jest.fn().mockReturnValue(
                    Promise.resolve({
                        oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                        created_at: 'test-dato',
                        dialog_id: 'dialog-id',
                        profilering_id: 'profilering-id',
                    }),
                ),
            };

            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository, microfrontendToggler));

            const response = await request(app)
                .get('/behov-for-veiledning')
                .set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                dato: 'test-dato',
                dialogId: 'dialog-id',
                profileringId: 'profilering-id',
            });
        });

        it('returnerer 204 når ingen treff i db', async () => {
            const behovRepository = {
                lagreBehov: jest.fn(),
                hentBehov: jest.fn().mockReturnValue(Promise.resolve(null)),
            };

            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository, microfrontendToggler));

            const response = await request(app)
                .get('/behov-for-veiledning')
                .set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(response.statusCode).toEqual(204);
        });
    });

    describe('POST', () => {
        let behovRepository: BehovRepository;
        beforeEach(() => {
            jest.resetAllMocks();
            behovRepository = {
                hentBehov: jest.fn(),
                lagreBehov: jest.fn().mockReturnValue(
                    Promise.resolve({
                        oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                        created_at: 'test-dato',
                        dialog_id: 'dialog-id',
                        profilering_id: 'profilering-id',
                    }),
                ),
            };
        });

        it('lagrer og returnerer {oppfolging, dato, dialogId}', async () => {
            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository, microfrontendToggler));

            const response = await request(app)
                .post('/behov-for-veiledning')
                .send({
                    oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                    dialogId: 'dialog-id-1',
                    profileringId: 'profilering-id-1',
                })
                .set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(response.statusCode).toEqual(201);
            expect(behovRepository.lagreBehov).toHaveBeenCalledWith({
                bruker: 'test-ident',
                foedselsnummer: 'test-fnr',
                oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                dialogId: 'dialog-id-1',
                profileringId: 'profilering-id-1',
            });
            expect(response.body).toEqual({
                oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                dato: 'test-dato',
                dialogId: 'dialog-id',
                profileringId: 'profilering-id',
            });
        });
        it('gjør ikke microfrontend toggling når unleash er av', async () => {
            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository, microfrontendToggler));

            const response = await request(app)
                .post('/behov-for-veiledning')
                .send({
                    oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                    dialogId: 'dialog-id-1',
                    profileringId: 'profilering-id-1',
                })
                .set('authorization', 'token234');
            console.log((microfrontendToggler.toggle as jest.Mock).length);
            expect(microfrontendToggler.toggle).toHaveBeenCalledTimes(0);

            expect(response.statusCode).toEqual(201);
        });
        it('toggler av aia-behovsvurdering-mf når unleash er på', async () => {
            isEnabledMock.mockReturnValue(true);
            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository, microfrontendToggler));

            const response = await request(app)
                .post('/behov-for-veiledning')
                .send({
                    oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                    dialogId: 'dialog-id-1',
                    profileringId: 'profilering-id-1',
                })
                .set('authorization', 'token123');

            expect(microfrontendToggler.toggle).toHaveBeenCalledTimes(1);
            expect(microfrontendToggler.toggle).toHaveBeenCalledWith('disable', 'aia-behovsvurdering', 'token123');

            expect(response.statusCode).toEqual(201);
        });
    });
});
