import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('should instantiate without crashing', async () => {
    const service = new PrismaService();
    expect(service).toBeDefined();
    await service.$disconnect();
  });
});
