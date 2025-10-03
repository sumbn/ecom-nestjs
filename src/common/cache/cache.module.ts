import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CACHE_SERVICE } from './cache.interface';
import { MemoryCacheService } from './cache.memory.service';

@Module({})
export class CacheModule {
  static register(): DynamicModule {
    const driver = process.env.CACHE_DRIVER || 'memory';

    const provider: Provider = {
      provide: CACHE_SERVICE,
      useClass: driver === 'redis' ? MemoryCacheService : MemoryCacheService, // For now, only memory
    };

    return {
      module: CacheModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
