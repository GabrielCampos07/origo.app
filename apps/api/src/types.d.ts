import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser?: {
      userId: string;
      email: string;
      role: 'PROFESSIONAL' | 'STUDENT';
      subscriptionActive: boolean;
    };
    rawBody?: Buffer;
  }
}
