import swaggerJsdoc from 'swagger-jsdoc';
import config from './';

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        basePath: '/aia-backend',
        info: {
            title: 'AIA Backend',
            description: `Proxy-api for aia (Arbeidsflate for innlogget arbeidssøker) frontend.\n\nGithub repo: [https://github.com/navikt/aia-backend](https://github.com/navikt/aia-backend)\n\nSlack: [#po-arbeid-paw](https://nav-it.slack.com/archives/CK0RPQ5QB)`,
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: config.SSO_NAV_COOKIE,
                },
            },
            schemas: {
                Unauthorized: {
                    description:
                        'Uautentisert forespørsel. Må være autentisert med selvbetjening-cookie. Token kan være gått ut.',
                },
                Ok: {
                    description: 'Vellykket forespørsel.',
                },
                Error: {
                    description: 'Noe gikk galt',
                },
                MeldeperiodeInn: {
                    required: ['fra', 'kanKortSendes', 'kortKanSendesFra', 'periodeKode', 'til'],
                    type: 'object',
                    properties: {
                        fra: { type: 'string', format: 'date' },
                        til: { type: 'string', format: 'date' },
                        kortKanSendesFra: { type: 'string', format: 'date' },
                        kanKortSendes: { type: 'boolean' },
                        periodeKode: { type: 'string' },
                    },
                },
                PersonStatus: {
                    required: ['id'],
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        statusArbeidsoker: { type: 'string' },
                        statusYtelse: { type: 'string' },
                    },
                },
                Meldekort: {
                    required: ['korrigerbart', 'kortStatus', 'kortType', 'meldegruppe', 'meldekortId', 'meldeperiode'],
                    type: 'object',
                    properties: {
                        meldekortId: { type: 'integer', format: 'int64' },
                        kortType: {
                            type: 'string',
                            enum: ['01', '03', '04', '05', '06', '07', '08', '09', '10'],
                        },
                        meldeperiode: { $ref: '#/components/schemas/MeldeperiodeInn' },
                        meldegruppe: {
                            type: 'string',
                            enum: ['ATTF', 'DAGP', 'INDIV', 'ARBS', 'FY', 'NULL'],
                        },
                        kortStatus: {
                            type: 'string',
                            enum: [
                                'OPPRE',
                                'SENDT',
                                'SLETT',
                                'REGIS',
                                'FMOPP',
                                'FUOPP',
                                'KLAR',
                                'KAND',
                                'IKKE',
                                'OVERM',
                                'NYKTR',
                                'FERDI',
                                'FEIL',
                                'VENTE',
                                'OPPF',
                                'UBEHA',
                            ],
                        },
                        bruttoBelop: { type: 'number', format: 'float' },
                        erForskuddsPeriode: { type: 'boolean' },
                        mottattDato: { type: 'string', format: 'date' },
                        korrigerbart: { type: 'boolean' },
                    },
                },
                MeldekortDto: {
                    type: 'object',
                    properties: {
                        erArbeidssokerNestePeriode: {
                            type: 'boolean',
                        },
                        periodeFra: {
                            type: 'string',
                            format: 'date',
                        },
                        periodeTil: {
                            type: 'string',
                            format: 'date',
                        },
                        meldekorttype: {
                            type: 'string',
                            enum: [
                                'ORDINAER',
                                'ERSTATNING',
                                'RETUR',
                                'ELEKTRONISK',
                                'AAP',
                                'ORDINAER_MANUELL',
                                'MASKINELT_OPPDATERT',
                                'MANUELL_ARENA',
                                'KORRIGERT_ELEKTRONISK',
                            ],
                        },
                        eventOpprettet: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                MeldekortDtoListe: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/MeldekortDto',
                    },
                },
                Fravaer: {
                    required: ['fraDato', 'tilDato', 'type'],
                    type: 'object',
                    properties: {
                        fraDato: { type: 'string', format: 'date' },
                        tilDato: { type: 'string', format: 'date' },
                        type: { type: 'string' },
                    },
                },
                Person: {
                    required: ['etterregistrerteMeldekort', 'maalformkode', 'meldeform', 'meldekort'],
                    type: 'object',
                    properties: {
                        maalformkode: { type: 'string' },
                        meldeform: { type: 'string' },
                        meldekort: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Meldekort' },
                        },
                        etterregistrerteMeldekort: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Meldekort' },
                        },
                        fravaer: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Fravaer' },
                        },
                        id: { type: 'string' },
                        antallGjenstaaendeFeriedager: {
                            type: 'integer',
                            format: 'int32',
                        },
                    },
                    BrukerRegistrering: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'integer',
                                format: 'int64',
                            },
                            manueltRegistrertAv: {
                                $ref: '#/components/schemas/Veileder',
                            },
                        },
                    },
                },
                BrukerRegistreringWrapper: {
                    type: 'object',
                    properties: {
                        registrering: {
                            $ref: '#/components/schemas/BrukerRegistrering',
                        },
                        type: {
                            type: 'string',
                            enum: ['ORDINAER', 'SYKMELDT'],
                        },
                    },
                },
                StartRegistreringStatusDto: {
                    type: 'object',
                    properties: {
                        maksDato: {
                            type: 'string',
                        },
                        underOppfolging: {
                            type: 'boolean',
                        },
                        erSykmeldtMedArbeidsgiver: {
                            type: 'boolean',
                        },
                        jobbetSeksAvTolvSisteManeder: {
                            type: 'boolean',
                        },
                        registreringType: {
                            type: 'string',
                            enum: [
                                'REAKTIVERING',
                                'ALLEREDE_REGISTRERT',
                                'SYKMELDT_REGISTRERING',
                                'ORDINAER_REGISTRERING',
                            ],
                        },
                        harIgangsattRegistreringSomKanGjenopptas: {
                            type: 'boolean',
                        },
                        formidlingsgruppe: {
                            type: 'string',
                        },
                        servicegruppe: {
                            type: 'string',
                        },
                        rettighetsgruppe: {
                            type: 'string',
                        },
                        geografiskTilknytning: {
                            type: 'string',
                        },
                        alder: {
                            type: 'integer',
                            format: 'int32',
                        },
                    },
                },
                ArbeidssokerperiodeDto: {
                    type: 'object',
                    properties: {
                        fraOgMedDato: {
                            type: 'string',
                        },
                        tilOgMedDato: {
                            type: 'string',
                        },
                    },
                },
                ArbeidssokerperioderDto: {
                    type: 'object',
                    properties: {
                        arbeidssokerperioder: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ArbeidssokerperiodeDto',
                            },
                        },
                    },
                },
                KanReaktiveresDto: {
                    type: 'object',
                    properties: {
                        kanReaktiveres: {
                            type: 'boolean',
                        },
                    },
                },
                BehovForVeiledningRequest: {
                    required: ['foedselsnummer'],
                    type: 'object',
                    properties: {
                        foedselsnummer: { type: 'string' },
                    },
                },
                BehovForVeiledningResponse: {
                    type: 'object',
                    properties: {
                        oppfolging: {
                            type: 'string',
                            enum: ['STANDARD_INNSATS', 'SITUASJONSBESTEMT_INNSATS'],
                        },
                        dato: { type: 'string' },
                        dialogId: { type: 'string' },
                        tekster: {
                            type: 'object',
                            properties: {
                                sporsmal: { type: 'string' },
                                svar: {
                                    type: 'object',
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                cookieAuth: [],
            },
        ],
    },
    apis: ['./src/api/**/*.ts'],
};

export default swaggerJsdoc(options);
