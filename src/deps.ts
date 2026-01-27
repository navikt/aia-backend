import createTokenDings, { Auth } from './auth/tokenDings';
import createProfilRepository, { ProfilRepository } from './db/profilRepository';
import { PrismaClient } from '@prisma/client';
import createBehovRepository, { BehovRepository } from './db/behovForVeiledningRepository';

export interface Dependencies {
    tokenDings: Promise<Auth>;
    profilRepository: ProfilRepository;
    behovRepository: BehovRepository;
}

function createDependencies(): Dependencies {
    const prismaClient = new PrismaClient();
    const tokenDings = createTokenDings();

    return {
        tokenDings,
        profilRepository: createProfilRepository(prismaClient),
        behovRepository: createBehovRepository(prismaClient),
    };
}

export default createDependencies;
