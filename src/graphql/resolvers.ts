import { getArbeidssokerperioder, getOpplysninger, getProfilering } from './dataLoaders';

const resolvers = {
    Query: {
        perioder: async (parent: any, args: any, context: any) => {
            return getArbeidssokerperioder(context.token);
        },
    },
    ArbeidssokerPeriode: {
        opplysninger: async (parent: any, args: any, context: any) => {
            return getOpplysninger(context.token, parent.periodeId);
        },
        profilering: async (parent: any, args: any, context: any) => {
            return getProfilering(context.token, parent.periodeId);
        },
    },
};

export default resolvers;
