import { Oppfolging, BehovForVeiledning, PrismaClient } from '@prisma/client';
import logger from '../logger';

interface LagreBehovDto {
    bruker: string;
    foedselsnummer?: string;
    oppfolging: Oppfolging;
    dialogId?: string;
    profileringId?: string;
}

export interface BehovRepository {
    lagreBehov(data: LagreBehovDto): Promise<BehovForVeiledning>;
    hentBehov(bruker: { bruker_id: string } | { foedselsnummer: string }): Promise<BehovForVeiledning | null>;
}

function createBehovRepository(prismaClient: PrismaClient): BehovRepository {
    return {
        async lagreBehov(data: LagreBehovDto): Promise<BehovForVeiledning> {
            return prismaClient.behovForVeiledning.create({
                data: {
                    bruker_id: data.bruker,
                    foedselsnummer: data.foedselsnummer,
                    oppfolging: data.oppfolging,
                    dialog_id: data.dialogId,
                    profilering_id: data.profileringId,
                },
            });
        },
        async hentBehov(
            bruker: { bruker_id: string } | { foedselsnummer: string },
        ): Promise<BehovForVeiledning | null> {
            try {
                const brukerFilter = Object.keys(bruker).reduce((res, key) => {
                    res[key] = { equals: (bruker as any)[key] };
                    return res;
                }, {} as any);

                const behov = await prismaClient.behovForVeiledning.findFirst({
                    where: {
                        ...brukerFilter,
                    },
                    orderBy: {
                        id: 'desc',
                    },
                });

                if (!behov) {
                    return null;
                }

                return behov;
            } catch (err) {
                logger.error(`Feil ved henting av profil: ${err}`);
                throw err;
            }
        },
    };
}

export default createBehovRepository;
