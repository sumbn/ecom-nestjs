import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from './common/decorators/public.decorator';

/**
 * Controller chính của app
 * - Public endpoints: root và health check
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Health check endpoint - public access
   * @returns Status của database và application
   */
  @Public()
  @Get('health')
  async healthCheck(): Promise<{
    status: string;
    database: string;
    timestamp: string;
    uptime?: number;
    error?: string;
  }> {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
