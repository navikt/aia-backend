export interface IEnvironmentVariables {
    TOKEN_X_WELL_KNOWN_URL: string;
    TOKEN_X_CLIENT_ID: string;
    TOKEN_X_PRIVATE_JWK: string;
    TOKEN_X_TOKEN_ENDPOINT: string;
    TOKEN_X_JWKS_URI: string;
    TOKEN_X_ISSUER: string;
    UNLEASH_SERVER_API_URL: string;
    UNLEASH_SERVER_API_TOKEN: string;
    VEILARBDIALOG_API_URL: string;
    VEILARBOPPFOLGING_URL: string;
    VEILARBVEDTAKINFO_URL: string;
    NAIS_CLUSTER_NAME: string;
    BASE_PATH: string;
    IDPORTEN_JWKS_URI: string;
    AZURE_APP_WELL_KNOWN_URL: string;
    AZURE_APP_CLIENT_ID: string;
    AZURE_OPENID_CONFIG_TOKEN_ENDPOINT: string;
    AZURE_APP_CLIENT_SECRET: string;
    APP_NAME: string;
    BESVARELSE_URL: string;
    SSO_NAV_COOKIE: string;
    OPPGAVE_URL: string;
    OPPGAVE_API_SCOPE: string;
    ARBEIDSSOKERREGISTERET_OPPSLAG_API_URL: string;
    ARBEIDSSOKERREGISTERET_INNGANG_API_URL: string;
    PAW_MICROFRONTEND_TOGGLER_URL: string;
    BEKREFTELSE_API_URL: string;
}

const env = process.env as unknown as IEnvironmentVariables;

export default {
    CONSUMER_ID_HEADER_NAME: 'Nav-Consumer-Id',
    CONSUMER_ID_HEADER_VALUE: 'paw:aia-backend',
    ...env,
};
