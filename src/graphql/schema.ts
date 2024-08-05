import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import resolvers from './resolvers';

const typeDefs = loadSchemaSync('**/*.graphqls', {
    loaders: [new GraphQLFileLoader()],
});

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    //resolvers: isLocalOrDemo ? mockResolvers : resolvers,
});

export default schema;
