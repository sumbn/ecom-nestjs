import { SessionResponseDto } from '../session-response.dto';
import { plainToInstance } from 'class-transformer';

describe('SessionResponseDto', () => {
  it('should be defined', () => {
    const dto = new SessionResponseDto();
    expect(dto).toBeDefined();
  });

  describe('transformation', () => {
    it('should transform plain object to SessionResponseDto', () => {
      const plain = {
        id: 'session-123',
        deviceInfo: 'Windows PC',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2025-01-01'),
        expiresAt: new Date('2025-01-08'),
      };

      const dto = plainToInstance(SessionResponseDto, plain, {
        excludeExtraneousValues: true,
      });

      expect(dto.id).toBe(plain.id);
      expect(dto.deviceInfo).toBe(plain.deviceInfo);
      expect(dto.ipAddress).toBe(plain.ipAddress);
      expect(dto.userAgent).toBe(plain.userAgent);
      expect(dto.createdAt).toEqual(plain.createdAt);
      expect(dto.expiresAt).toEqual(plain.expiresAt);
    });

    it('should expose all required fields', () => {
      const plain = {
        id: 'session-456',
        deviceInfo: 'Mobile Device',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (iPhone)',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const dto = plainToInstance(SessionResponseDto, plain, {
        excludeExtraneousValues: true,
      });

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('deviceInfo');
      expect(dto).toHaveProperty('ipAddress');
      expect(dto).toHaveProperty('userAgent');
      expect(dto).toHaveProperty('createdAt');
      expect(dto).toHaveProperty('expiresAt');
    });

    it('should exclude extra fields not decorated with @Expose', () => {
      const plain = {
        id: 'session-789',
        deviceInfo: 'Tablet',
        ipAddress: '172.16.0.1',
        userAgent: 'Mozilla/5.0 (iPad)',
        createdAt: new Date(),
        expiresAt: new Date(),
        extraField: 'should be excluded',
        anotherField: 123,
      };

      const dto = plainToInstance(SessionResponseDto, plain, {
        excludeExtraneousValues: true,
      });

      expect(dto).not.toHaveProperty('extraField');
      expect(dto).not.toHaveProperty('anotherField');
    });
  });

  describe('isCurrent getter', () => {
    it('should have isCurrent property with default value false', () => {
      const dto = new SessionResponseDto();
      expect(dto.isCurrent).toBe(false);
    });

    it('should return false by default when transformed', () => {
      const plain = {
        id: 'session-123',
        deviceInfo: 'Windows PC',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      const dto = plainToInstance(SessionResponseDto, plain, {
        excludeExtraneousValues: true,
      });

      expect(dto.isCurrent).toBe(false);
    });
  });

  describe('field validation', () => {
    it('should handle different device types', () => {
      const devices = [
        'Windows PC',
        'Mac',
        'Linux',
        'Mobile Device',
        'Tablet',
        'Unknown Device',
      ];

      devices.forEach((deviceInfo) => {
        const dto = plainToInstance(
          SessionResponseDto,
          {
            id: 'session-test',
            deviceInfo,
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            createdAt: new Date(),
            expiresAt: new Date(),
          },
          { excludeExtraneousValues: true },
        );

        expect(dto.deviceInfo).toBe(deviceInfo);
      });
    });

    it('should handle various IP address formats', () => {
      const ipAddresses = [
        '127.0.0.1',
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '::1',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      ];

      ipAddresses.forEach((ipAddress) => {
        const dto = plainToInstance(
          SessionResponseDto,
          {
            id: 'session-test',
            deviceInfo: 'Test Device',
            ipAddress,
            userAgent: 'test-agent',
            createdAt: new Date(),
            expiresAt: new Date(),
          },
          { excludeExtraneousValues: true },
        );

        expect(dto.ipAddress).toBe(ipAddress);
      });
    });

    it('should handle date objects correctly', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const dto = plainToInstance(
        SessionResponseDto,
        {
          id: 'session-test',
          deviceInfo: 'Test Device',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: now,
          expiresAt: future,
        },
        { excludeExtraneousValues: true },
      );

      expect(dto.createdAt).toEqual(now);
      expect(dto.expiresAt).toEqual(future);
      expect(dto.expiresAt.getTime()).toBeGreaterThan(dto.createdAt.getTime());
    });
  });

  describe('real-world scenarios', () => {
    it('should handle mobile session data', () => {
      const mobileSession = {
        id: 'mobile-session-123',
        deviceInfo: 'Mobile Device',
        ipAddress: '192.168.1.100',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        createdAt: new Date('2025-01-01T10:00:00Z'),
        expiresAt: new Date('2025-01-08T10:00:00Z'),
      };

      const dto = plainToInstance(SessionResponseDto, mobileSession, {
        excludeExtraneousValues: true,
      });

      expect(dto.id).toBe(mobileSession.id);
      expect(dto.deviceInfo).toBe('Mobile Device');
      expect(dto.isCurrent).toBe(false);
    });

    it('should handle desktop session data', () => {
      const desktopSession = {
        id: 'desktop-session-456',
        deviceInfo: 'Windows PC',
        ipAddress: '10.0.0.50',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date('2025-01-02T14:30:00Z'),
        expiresAt: new Date('2025-01-09T14:30:00Z'),
      };

      const dto = plainToInstance(SessionResponseDto, desktopSession, {
        excludeExtraneousValues: true,
      });

      expect(dto.id).toBe(desktopSession.id);
      expect(dto.deviceInfo).toBe('Windows PC');
      expect(dto.isCurrent).toBe(false);
    });
  });
});
