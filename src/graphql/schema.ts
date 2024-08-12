import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import resolvers from './resolvers';
import mockResolvers from './mockResolvers';

const typeDefs = loadSchemaSync('**/*.graphqls', {
    loaders: [new GraphQLFileLoader()],
});

const isDevelopment = process.env.NODE_ENV === 'development';

const schema = makeExecutableSchema({
    typeDefs,
    resolvers: isDevelopment ? mockResolvers : resolvers,
});

export default schema;
