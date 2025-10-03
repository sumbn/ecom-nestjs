import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_SERVICE } from '../cache.interface';
import { CacheModule } from '../cache.module';
import { CacheService } from '../cache.interface';
import { MemoryCacheService } from '../cache.memory.service';

describe('CacheModule', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
    }).compile();

    service = module.get<CacheService>(CACHE_SERVICE);
  });

  it('should provide CacheService', () => {
    expect(service).toBeDefined();
  });

  it('should allow setting and getting values', async () => {
    await service.set('test', 'value');
    const result = await service.get('test');
    expect(result).toBe('value');
  });

  it('should export CacheService', () => {
    expect(service).toBeInstanceOf(MemoryCacheService);
  });
});
