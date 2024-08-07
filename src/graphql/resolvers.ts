import { getArbeidssokerperioder, getOpplysninger } from './services/arbeidssokerperioder-service';

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
    },
};

// const resolvers = {
//     Query: {
//         perioder: async (parent: any, args: any, context: any) => {
//             return [
//                 {
//                     periodeId: 'eb39f0ee-ddba-42a1-8ed3-590285b2e279',
//                     startet: {
//                         tidspunkt: '2024-03-14T12:29:10.926Z',
//                         utfoertAv: {
//                             type: 'VEILEDER',
//                         },
//                         kilde: 'paw-arbeidssoekerregisteret-inngang',
//                         aarsak: 'Er over 18 år, er bosatt i Norge etter Folkeregisterloven',
//                     },
//                     avsluttet: null,
//                 },
//             ]
//         },
//     },
//     ArbeidssokerPeriode: {
//         opplysninger: async (parent: any, args: any, context: any) => {
//             console.log('parent?', parent)
//             return [
//                 {
//                     opplysningerOmArbeidssoekerId: '9077e4b5-807c-4568-9e04-8bf06e49d9fc',
//                     periodeId: 'eb39f0ee-ddba-42a1-8ed3-590285b2e279',
//                     sendtInnAv: {
//                         tidspunkt: '2024-03-14T13:15:48.969Z',
//                         utfoertAv: {
//                             type: 'VEILEDER',
//                             id: 'lol',
//                         },
//                         kilde: 'paw-arbeidssoekerregisteret-inngang',
//                         aarsak: 'opplysning om arbeidssøker sendt inn',
//                     },
//                     utdanning: {
//                         nus: '4',
//                         bestaatt: 'JA',
//                         godkjent: 'JA',
//                     },
//                     //     utdanning: {
//                     //         nus: '0',
//                     //         bestaatt: null as any,
//                     //         godkjent: null as any,
//                     //     },
//                     helse: {
//                         helsetilstandHindrerArbeid: 'NEI',
//                     },
//                     annet: {
//                         andreForholdHindrerArbeid: 'NEI',
//                     },
//                     jobbsituasjon: [
//                         {
//                             beskrivelse: 'HAR_SAGT_OPP',
//                             detaljer: {
//                                 stilling_styrk08: '7213',
//                                 stilling: 'Bilskadereparatør',
//                             },
//                         },
//                     ],
//                     // jobbsituasjon: [
//                     //     {
//                     //         beskrivelse: 'HAR_BLITT_SAGT_OPP',
//                     //         detaljer: {
//                     //             stilling_styrk08: '3439',
//                     //             stilling: 'Sufflør',
//                     //         },
//                     //     },
//                     // ],
//                 },
//             ];
//         },
//     },
// };

export default resolvers;
