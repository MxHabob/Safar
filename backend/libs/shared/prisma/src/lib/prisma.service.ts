import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withPulse } from '@prisma/extension-pulse';

const PrismaWithAccelerate = PrismaClient.$extends(withAccelerate());
const PrismaWithPulse = PrismaWithAccelerate.$extends(withPulse());

@Injectable()
export class PrismaService extends PrismaWithPulse implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn']
          : ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}

