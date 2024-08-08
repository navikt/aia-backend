import { getArbeidssokerperioder, getOpplysninger, getProfilering } from './dataLoaders';
import { Resolvers } from './resolver-types.generated';

const resolvers: Partial<Resolvers> = {
    Query: {
        perioder: async (parent, args, context) => {
            return getArbeidssokerperioder(context.token);
        },
    },
    ArbeidssokerPeriode: {
        opplysninger: async (parent, args, context) => {
            return getOpplysninger(context.token, parent.periodeId);
        },
        profilering: async (parent, args, context) => {
            return getProfilering(context.token, parent.periodeId);
        },
    },
};

export default resolvers;
