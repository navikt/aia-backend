import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';
import createProfilRepository, { ProfilRepository } from '../../src/db/profilRepository';

describe('profilRepository', () => {
    let repository: ProfilRepository, prismaClient: DeepMockProxy<PrismaClient>;
    beforeEach(() => {
        prismaClient = mockDeep<PrismaClient>();
        repository = createProfilRepository(prismaClient);
    });

    describe('lagreProfil', () => {
        it('lagrer profil for bruker', () => {
            const profilDto = {
                bruker: 'test',
                profil: {
                    aiaAvslaattEgenvurdering: '2022-18-10',
                },
            };
            repository.lagreProfil(profilDto);

            expect(prismaClient.profil.create).toHaveBeenCalledWith({
                data: {
                    bruker_id: 'test',
                    profil: {
                        aiaAvslaattEgenvurdering: '2022-18-10',
                    },
                },
            });
        });
    });

    describe('hentProfil', () => {
        it('henter nyeste profil for bruker', async () => {
            const profil = {
                id: 42,
                bruker_id: 'test',
                profil: {
                    aiaAvslaattEgenvurdering: '2022-18-10',
                },
                created_at: new Date(),
            };

            prismaClient.profil.findFirst.mockResolvedValue(profil);

            const result = await repository.hentProfil('test');

            expect(prismaClient.profil.findFirst).toHaveBeenCalledWith({
                where: {
                    bruker_id: {
                        equals: 'test',
                    },
                },
                orderBy: {
                    id: 'desc',
                },
            });

            expect(result).toEqual({
                aiaAvslaattEgenvurdering: '2022-18-10',
            });
        });
    });
});
