import { PrismaClient } from '@prisma/client';
import logger from '../logger';

interface Feedback {
    updated: string;
    valgt: string;
}

interface JaEllerNei {
    oppdatert: string;
    valg: string;
}

interface ProfilJson {
    aiaFeedbackMeldekortForklaring?: Feedback;
    aiaFeedbackHjelpOgStotteForklaring?: Feedback;
    aiaFeedbackHjelpOgStotteForklaringUngdom?: Feedback;
    aiaFeedbackSvarFraRegistreringen?: Feedback;
    aiaAvslaattEgenvurdering?: string;
    aiaAvslaattEgenvurderingUke12?: string;
    aiaValgtPengestotteVisning?: string;
    aiaReaktiveringVisning?: JaEllerNei;
}

// export interface Profil {
//     id: string;
//     bruker_id: string;
//     profil: ProfilJson;
//     created_at: string;
// }

interface LagreProfilDto {
    bruker: string;
    profil: ProfilJson;
}

export interface ProfilRepository {
    lagreProfil(data: LagreProfilDto): Promise<void>;
    hentProfil(bruker: string): Promise<ProfilJson | null>;
}

function createProfilRepository(prismaClient: PrismaClient): ProfilRepository {
    return {
        async lagreProfil(data: LagreProfilDto) {
            await prismaClient.profil.create({ data: { bruker_id: data.bruker, profil: data.profil as any } });
        },
        async hentProfil(bruker: string): Promise<ProfilJson | null> {
            try {
                const profil = await prismaClient.profil.findFirst({
                    where: {
                        bruker_id: {
                            equals: bruker,
                        },
                    },
                    orderBy: {
                        id: 'desc',
                    },
                });

                if (!profil) {
                    return null;
                }

                return profil.profil as ProfilJson;
            } catch (err) {
                logger.error(`Feil ved henting av profil: ${err}`);
                return null;
            }
        },
    };
}

export default createProfilRepository;
