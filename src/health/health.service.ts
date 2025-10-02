import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async check() {
    const startTime = Date.now();
    
    try {
      // Check database connection
      const databaseStatus = await this.checkDatabase();
      
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
      const usedMemory = memoryUsage.heapUsed + memoryUsage.external;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      const healthData = {
        status: databaseStatus === 'connected' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.configService.get('NODE_ENV', 'development'),
        version: this.configService.get('npm_package_version', '1.0.0'),
        database: databaseStatus,
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage * 100) / 100,
        },
      };

      const responseTime = Date.now() - startTime;
      
      return {
        statusCode: healthData.status === 'ok' ? 200 : 503,
        message: healthData.status === 'ok' ? 'Service is healthy' : 'Service is unhealthy',
        data: {
          ...healthData,
          responseTime: `${responseTime}ms`,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 503,
        message: 'Service is unhealthy',
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: this.configService.get('NODE_ENV', 'development'),
          version: this.configService.get('npm_package_version', '1.0.0'),
          database: 'error',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async ready() {
    try {
      const databaseStatus = await this.checkDatabase();
      
      return {
        statusCode: databaseStatus === 'connected' ? 200 : 503,
        message: databaseStatus === 'connected' ? 'Service is ready' : 'Service is not ready',
        data: {
          status: databaseStatus === 'connected' ? 'ready' : 'not ready',
          timestamp: new Date().toISOString(),
          database: databaseStatus,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 503,
        message: 'Service is not ready',
        data: {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          database: 'error',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  async live() {
    return {
      statusCode: 200,
      message: 'Service is alive',
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
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
    } catch (error) {
      return 'disconnected';
    }
  }
}
