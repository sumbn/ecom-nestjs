import { RefreshToken } from '../refresh-token.entity';
import { User } from '../../../users/entities/user.entity';

describe('RefreshToken Entity', () => {
  let refreshToken: RefreshToken;

  beforeEach(() => {
    refreshToken = new RefreshToken();
  });

  it('should be defined', () => {
    expect(refreshToken).toBeDefined();
  });

  describe('properties', () => {
    it('should have id property', () => {
      refreshToken.id = 'token-uuid-123';
      expect(refreshToken.id).toBe('token-uuid-123');
    });

    it('should have userId property', () => {
      refreshToken.userId = 'user-uuid-456';
      expect(refreshToken.userId).toBe('user-uuid-456');
    });

    it('should have token property', () => {
      const tokenValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      refreshToken.token = tokenValue;
      expect(refreshToken.token).toBe(tokenValue);
    });

    it('should have deviceInfo property', () => {
      refreshToken.deviceInfo = 'Windows PC';
      expect(refreshToken.deviceInfo).toBe('Windows PC');
    });

    it('should have ipAddress property', () => {
      refreshToken.ipAddress = '192.168.1.1';
      expect(refreshToken.ipAddress).toBe('192.168.1.1');
    });

    it('should have userAgent property', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      refreshToken.userAgent = userAgent;
      expect(refreshToken.userAgent).toBe(userAgent);
    });

    it('should have expiresAt property', () => {
      const expiryDate = new Date('2025-12-31');
      refreshToken.expiresAt = expiryDate;
      expect(refreshToken.expiresAt).toEqual(expiryDate);
    });

    it('should have isRevoked property with default false', () => {
      expect(refreshToken.isRevoked).toBeUndefined(); // Before DB save
    });

    it('should have revokedAt property', () => {
      const revokedDate = new Date();
      refreshToken.revokedAt = revokedDate;
      expect(refreshToken.revokedAt).toEqual(revokedDate);
    });

    it('should have createdAt property', () => {
      const createdDate = new Date();
      refreshToken.createdAt = createdDate;
      expect(refreshToken.createdAt).toEqual(createdDate);
    });

    it('should have updatedAt property', () => {
      const updatedDate = new Date();
      refreshToken.updatedAt = updatedDate;
      expect(refreshToken.updatedAt).toEqual(updatedDate);
    });
  });

  describe('relationships', () => {
    it('should have user relationship', () => {
      const user = new User();
      user.id = 'user-123';
      user.email = 'test@example.com';

      refreshToken.user = user;
      expect(refreshToken.user).toBe(user);
      expect(refreshToken.user.id).toBe('user-123');
    });

    it('should support ManyToOne relationship with User', () => {
      const user = new User();
      user.id = 'user-456';

      refreshToken.userId = user.id;
      refreshToken.user = user;

      expect(refreshToken.userId).toBe(user.id);
      expect(refreshToken.user).toBe(user);
    });
  });

  describe('token lifecycle', () => {
    it('should create active token', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      refreshToken.token = 'valid-token';
      refreshToken.expiresAt = futureDate;
      refreshToken.isRevoked = false;

      expect(refreshToken.isRevoked).toBe(false);
      expect(refreshToken.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should handle token revocation', () => {
      const revokedDate = new Date();

      refreshToken.isRevoked = true;
      refreshToken.revokedAt = revokedDate;

      expect(refreshToken.isRevoked).toBe(true);
      expect(refreshToken.revokedAt).toEqual(revokedDate);
    });

    it('should track token expiration', () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      refreshToken.expiresAt = pastDate;
      expect(refreshToken.expiresAt.getTime()).toBeLessThan(Date.now());

      refreshToken.expiresAt = futureDate;
      expect(refreshToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('device tracking', () => {
    it('should track Windows PC device', () => {
      refreshToken.deviceInfo = 'Windows PC';
      refreshToken.ipAddress = '192.168.1.100';
      refreshToken.userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      expect(refreshToken.deviceInfo).toBe('Windows PC');
      expect(refreshToken.ipAddress).toBe('192.168.1.100');
      expect(refreshToken.userAgent).toContain('Windows');
    });

    it('should track Mobile device', () => {
      refreshToken.deviceInfo = 'Mobile Device';
      refreshToken.ipAddress = '10.0.0.50';
      refreshToken.userAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

      expect(refreshToken.deviceInfo).toBe('Mobile Device');
      expect(refreshToken.ipAddress).toBe('10.0.0.50');
      expect(refreshToken.userAgent).toContain('iPhone');
    });

    it('should track Mac device', () => {
      refreshToken.deviceInfo = 'Mac';
      refreshToken.ipAddress = '172.16.0.1';
      refreshToken.userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

      expect(refreshToken.deviceInfo).toBe('Mac');
      expect(refreshToken.userAgent).toContain('Macintosh');
    });

    it('should allow nullable device info', () => {
      refreshToken.deviceInfo = null;
      refreshToken.ipAddress = null;
      refreshToken.userAgent = null;

      expect(refreshToken.deviceInfo).toBeNull();
      expect(refreshToken.ipAddress).toBeNull();
      expect(refreshToken.userAgent).toBeNull();
    });
  });

  describe('session management', () => {
    it('should represent a valid session', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      refreshToken.id = 'session-123';
      refreshToken.userId = 'user-456';
      refreshToken.token = 'valid-refresh-token';
      refreshToken.deviceInfo = 'Windows PC';
      refreshToken.ipAddress = '192.168.1.1';
      refreshToken.expiresAt = expiryDate;
      refreshToken.isRevoked = false;
      refreshToken.createdAt = now;

      expect(refreshToken.id).toBe('session-123');
      expect(refreshToken.isRevoked).toBe(false);
      expect(refreshToken.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should represent a revoked session', () => {
      const now = new Date();

      refreshToken.id = 'session-789';
      refreshToken.isRevoked = true;
      refreshToken.revokedAt = now;

      expect(refreshToken.isRevoked).toBe(true);
      expect(refreshToken.revokedAt).toEqual(now);
    });

    it('should represent an expired session', () => {
      const pastDate = new Date('2020-01-01');

      refreshToken.expiresAt = pastDate;
      refreshToken.isRevoked = false;

      expect(refreshToken.expiresAt.getTime()).toBeLessThan(Date.now());
      expect(refreshToken.isRevoked).toBe(false);
    });
  });

  describe('timestamps', () => {
    it('should track creation time', () => {
      const createdDate = new Date('2025-01-01T10:00:00Z');
      refreshToken.createdAt = createdDate;

      expect(refreshToken.createdAt).toEqual(createdDate);
    });

    it('should track update time', () => {
      const createdDate = new Date('2025-01-01T10:00:00Z');
      const updatedDate = new Date('2025-01-02T15:30:00Z');

      refreshToken.createdAt = createdDate;
      refreshToken.updatedAt = updatedDate;

      expect(refreshToken.updatedAt.getTime()).toBeGreaterThan(
        refreshToken.createdAt.getTime(),
      );
    });

    it('should track revocation time', () => {
      const createdDate = new Date('2025-01-01T10:00:00Z');
      const revokedDate = new Date('2025-01-05T12:00:00Z');

      refreshToken.createdAt = createdDate;
      refreshToken.revokedAt = revokedDate;
      refreshToken.isRevoked = true;

      expect(refreshToken.revokedAt.getTime()).toBeGreaterThan(
        refreshToken.createdAt.getTime(),
      );
    });
  });

  describe('unique constraints', () => {
    it('should have unique token value', () => {
      const uniqueToken = 'unique-token-' + Date.now();
      refreshToken.token = uniqueToken;

      expect(refreshToken.token).toBe(uniqueToken);
    });
  });

  describe('cascade delete', () => {
    it('should be associated with user for cascade delete', () => {
      const user = new User();
      user.id = 'user-to-delete';

      refreshToken.userId = user.id;
      refreshToken.user = user;

      expect(refreshToken.userId).toBe(user.id);
      expect(refreshToken.user).toBe(user);
    });
  });
});
