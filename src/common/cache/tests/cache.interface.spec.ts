import { CACHE_SERVICE } from '../cache.interface';

describe('Cache Interface', () => {
  it('should define CACHE_SERVICE symbol', () => {
    expect(CACHE_SERVICE).toBeDefined();
    expect(typeof CACHE_SERVICE).toBe('symbol');
  });
});
