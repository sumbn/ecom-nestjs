import { Test, TestingModule } from '@nestjs/testing';
import { MemoryCacheService } from '../cache.memory.service';

describe('MemoryCacheService', () => {
  let service: MemoryCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryCacheService],
    }).compile();

    service = module.get<MemoryCacheService>(MemoryCacheService);
  });

  afterEach(async () => {
    await service.reset();
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await service.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return stored value', async () => {
      await service.set('test', 'value');
      const result = await service.get('test');
      expect(result).toBe('value');
    });

    it('should return expired value as null', async () => {
      await service.set('test', 'value', 0.001); // expire in 1ms
      await new Promise((resolve) => setTimeout(resolve, 2)); // wait 2ms
      const result = await service.get('test');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value without TTL', async () => {
      await service.set('test', 'value');
      const result = await service.get('test');
      expect(result).toBe('value');
    });

    it('should store value with TTL', async () => {
      await service.set('test', 'value', 1); // 1 second
      const result = await service.get('test');
      expect(result).toBe('value');
    });

    it('should overwrite existing value', async () => {
      await service.set('test', 'value1');
      await service.set('test', 'value2');
      const result = await service.get('test');
      expect(result).toBe('value2');
    });
  });

  describe('del', () => {
    it('should delete existing key', async () => {
      await service.set('test', 'value');
      await service.del('test');
      const result = await service.get('test');
      expect(result).toBeNull();
    });

    it('should not throw for non-existent key', async () => {
      await expect(service.del('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all entries', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.reset();

      expect(await service.get('key1')).toBeNull();
      expect(await service.get('key2')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle complex objects', async () => {
      const obj = { nested: { value: 42 } };
      await service.set('object', obj);
      const result = await service.get('object');
      expect(result).toEqual(obj);
    });

    it('should handle null values', async () => {
      await service.set('null', null);
      const result = await service.get('null');
      expect(result).toBeNull();
    });

    it('should handle empty string keys', async () => {
      await service.set('', 'value');
      const result = await service.get('');
      expect(result).toBe('value');
    });
  });
});
