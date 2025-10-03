import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  HealthCheckDto,
  ReadinessDto,
  LivenessDto,
} from './dto/health-check.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthCheckDto> {
    const startTime = Date.now();

    try {
      // Check database connection
      const databaseStatus = await this.checkDatabase();

      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
      const usedMemory = memoryUsage.heapUsed + memoryUsage.external;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      const responseTime = Date.now() - startTime;

      const result = {
        status: databaseStatus === 'connected' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.configService.get('NODE_ENV') || 'development',
        version: this.configService.get('npm_package_version') || '1.0.0',
        database: databaseStatus,
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage * 100) / 100,
        },
        responseTime: `${responseTime}ms`,
      } as HealthCheckDto;

      return result;
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: this.configService.get('npm_package_version', '1.0.0'),
        database: 'error',
        error: error.message,
      };
    }
  }

  async ready(): Promise<ReadinessDto> {
    try {
      const databaseStatus = await this.checkDatabase();

      return {
        status: databaseStatus === 'connected' ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        database: databaseStatus,
      };
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: error.message,
      };
    }
  }

  async live(): Promise<LivenessDto> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      if (!this.dataSource.isInitialized) {
        return 'not initialized';
      }

      // Simple query to check database connection
      await this.dataSource.query('SELECT 1');
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
