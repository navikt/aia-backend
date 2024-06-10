import createTokenDings, { Auth } from './auth/tokenDings';
import config from './config';
import createProfilRepository, { ProfilRepository } from './db/profilRepository';
import { PrismaClient } from '@prisma/client';
import createBehovRepository, { BehovRepository } from './db/behovForVeiledningRepository';
import createMicrofrontendToggler, { MicrofrontendToggler } from './microfrontendToggler';

export interface Dependencies {
    tokenDings: Promise<Auth>;
    profilRepository: ProfilRepository;
    behovRepository: BehovRepository;
    microfrontendToggler: Promise<MicrofrontendToggler>;
}

function createDependencies(): Dependencies {
    const prismaClient = new PrismaClient();
    const tokenDings = createTokenDings({
        tokenXWellKnownUrl: config.TOKEN_X_WELL_KNOWN_URL,
        tokenXClientId: config.TOKEN_X_CLIENT_ID,
        tokenXTokenEndpoint: config.TOKEN_X_TOKEN_ENDPOINT,
        tokenXPrivateJwk: config.TOKEN_X_PRIVATE_JWK,
    });
    return {
        tokenDings,
        profilRepository: createProfilRepository(prismaClient),
        behovRepository: createBehovRepository(prismaClient),
        microfrontendToggler: createMicrofrontendToggler(tokenDings),
    };
}

export default createDependencies;
