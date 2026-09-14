import { buildApp, prisma } from './app';

async function start() {
  try {
    const server = await buildApp();

    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`🚀 Origo API rodando em http://${host}:${port}`);
    server.log.info(`📋 Health check: http://${host}:${port}/health`);

    const shutdown = async (signal: string) => {
      server.log.info(`${signal} recebido, fechando servidor...`);
      await prisma.$disconnect();
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
