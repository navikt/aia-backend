import createTokenDings, { Auth } from './auth/tokenDings';
import { PrismaClient } from '@prisma/client';
import createBehovRepository, { BehovRepository } from './db/behovForVeiledningRepository';

export interface Dependencies {
    tokenDings: Promise<Auth>;
    behovRepository: BehovRepository;
}

function createDependencies(): Dependencies {
    const prismaClient = new PrismaClient();
    const tokenDings = createTokenDings();

    return {
        tokenDings,
        behovRepository: createBehovRepository(prismaClient),
    };
}

export default createDependencies;
