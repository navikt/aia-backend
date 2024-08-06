import { getArbeidssokerperioder } from './services/arbeidssokerperioder-service';

const resolvers = {
    Query: {
        perioder: async (parent: any, args: any, context: any) => {
            return getArbeidssokerperioder(context.token);
        },
    },
};

export default resolvers;
