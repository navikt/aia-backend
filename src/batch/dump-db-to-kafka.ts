import { PrismaClient } from '@prisma/client';
import createProducer from '../kafka/automatisk-reaktivert-producer';

(async function () {
    const prismaClient = new PrismaClient();
    const kafkaProducer = await createProducer();

    console.log('Starter med å hente automatiskReaktivering...');
    const automatiskReaktivering = await prismaClient.automatiskReaktivering.findMany({
        where: {
            created_at: {
                lt: new Date('2023-02-27 12:22:53.584000 UTC'),
            },
        },
    });
    console.log(`Fant ${automatiskReaktivering.length} rader`);
    console.log('Dumper automatiskReaktivering på kafka...');
    await kafkaProducer.send(automatiskReaktivering);
    console.log('Ferdig med automatiskReaktivering\n\n\n');

    console.log('Starter med å hente automatiskReaktiveringSvar...');
    const automatiskReaktiveringSvar = await prismaClient.automatiskReaktiveringSvar.findMany({
        where: {
            created_at: {
                lt: new Date('2023-02-27 12:26:09.939000 UTC'),
            },
        },
    });

    console.log(`Fant ${automatiskReaktiveringSvar.length} rader`);
    console.log('Dumper automatiskReaktiveringSvar på kafka...');
    await kafkaProducer.send(automatiskReaktiveringSvar);
    console.log('Ferdig med automatiskReaktiveringSvar\n\n');
})();
