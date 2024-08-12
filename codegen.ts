import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: './src/**/*.graphqls',
    generates: {
        './src/graphql/resolver-types.generated.ts': {
            plugins: [
                'typescript',
                'typescript-resolvers',
                { add: { placement: 'prepend', content: '/* eslint-disable */' } },
            ],
            config: {
                useIndexSignature: true,
                contextType: './resolverTypes#ResolverContextType',
                avoidOptionals: {
                    field: true,
                },
            },
        },
    },
};

export default config;
