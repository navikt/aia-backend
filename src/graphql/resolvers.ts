const resolvers = {
    Query: {
        perioder: () => {
            return Promise.resolve([
                {
                    periodeId: 'eb39f0ee-ddba-42a1-8ed3-590285b2e279',
                    startet: {
                        tidspunkt: '2024-03-14T12:29:10.926Z',
                        utfoertAv: {
                            type: 'VEILEDER',
                        },
                        kilde: 'paw-arbeidssoekerregisteret-inngang',
                        aarsak: 'Er over 18 år, er bosatt i Norge etter Folkeregisterloven',
                    },
                    avsluttet: null,
                },
            ]);
        },
    },
};

export default resolvers;
