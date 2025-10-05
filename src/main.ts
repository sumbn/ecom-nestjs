import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
const shouldBootstrap =
  process.env.NODE_ENV !== 'test' || process.env.BOOTSTRAP_IN_TEST === 'true';

if (shouldBootstrap) {
  void bootstrap();
}
