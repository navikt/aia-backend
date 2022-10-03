import F from 'fastify';
import healhApi from './api/health';
import unleashApi from './api/unleash';
import ptoProxy from './api/ptoproxy';
import cookie from '@fastify/cookie';

const PORT = 3000;

const fastify = F({ logger: true });
fastify.register(cookie)
fastify.register(healhApi)
fastify.register(unleashApi)
fastify.register(ptoProxy)


const startServer = async () => {
  try {
    console.log(`Starting server...`);
    await fastify.listen({port: PORT as number, host: '0.0.0.0'});
  } catch(err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  try {
    await fastify.close();
    fastify.log.info('Server closed...')
  } catch (err) {
    fastify.log.error(err)
  }
});
