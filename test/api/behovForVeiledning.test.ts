import request from 'supertest';
import express, { RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import behovForVeiledning from '../../src/api/behovForVeiledning';
import bodyParser from 'body-parser';
import { ValidatedRequest } from '../../src/middleware/token-validation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let isEnabledMock: any;

function isEnabled() {
    return isEnabledMock();
}

vi.mock('unleash-client', () => {
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
    let app: any;

    beforeEach(() => {
        app = express();
        app.use(cookieParser());
        app.use(bodyParser.json());
        isEnabledMock = vi.fn().mockReturnValue(false);
    });

    describe('GET', () => {
        it('returnerer {oppfolging, dato, dialogId}', async () => {
            const behovRepository = {
                lagreBehov: vi.fn(),
                hentBehov: vi.fn().mockReturnValue(
                    Promise.resolve({
                        oppfolging: 'SITUASJONSBESTEMT_INNSATS',
                        created_at: 'test-dato',
                        dialog_id: 'dialog-id',
                        profilering_id: 'profilering-id',
                    }),
                ),
            };

            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository));

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
                lagreBehov: vi.fn(),
                hentBehov: vi.fn().mockReturnValue(Promise.resolve(null)),
            };

            app.use(mockAuthMiddleware);
            app.use(behovForVeiledning(behovRepository));

            const response = await request(app)
                .get('/behov-for-veiledning')
                .set('Cookie', ['selvbetjening-idtoken=token123;']);

            expect(response.statusCode).toEqual(204);
        });
    });
});
