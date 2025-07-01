import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import createRepository, { AutomatiskReaktiveringRepository } from '../../src/db/automatiskReaktiveringRepository';

describe('automatiskReaktiveringRepository', () => {
    let repository: AutomatiskReaktiveringRepository, prismaClient: DeepMockProxy<PrismaClient>;

    beforeEach(() => {
        prismaClient = mockDeep<PrismaClient>();
        repository = createRepository(prismaClient);
    });

    describe('lagre', () => {
        it('lagrer bruker', async () => {
            const verdi = {
                id: 1,
                bruker_id: '42',
                created_at: new Date('2022-12-12T11:30:28.603Z'),
            };

            prismaClient.automatiskReaktivering.create.mockResolvedValue(verdi);

            await expect(repository.lagre('42')).resolves.toEqual({
                id: 1,
                bruker_id: '42',
                created_at: new Date('2022-12-12T11:30:28.603Z'),
            });
        });
    });

    describe('hente', () => {
        it('returnerer null når ingen fins', async () => {
            prismaClient.automatiskReaktivering.findFirst.mockResolvedValue(null);
            await expect(repository.hent('42')).resolves.toEqual(null);
        });

        it('kaster exception videre', async () => {
            prismaClient.automatiskReaktivering.findFirst.mockImplementation(() => {
                throw new Error('automatiskReaktivering feil');
            });
            await expect(repository.hent('42')).rejects.toThrow('automatiskReaktivering feil');
        });

        it('returnerer automatiskReaktivering', async () => {
            prismaClient.automatiskReaktivering.findFirst.mockResolvedValue({
                id: 42,
                bruker_id: 'test-123',
                created_at: new Date('2022-12-12T11:30:28.603Z'),
            });

            await expect(repository.hent('test-123')).resolves.toEqual({
                id: 42,
                bruker_id: 'test-123',
                created_at: new Date('2022-12-12T11:30:28.603Z'),
            });
        });
    });
});
