import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<{
    statusCode: number;
    message: string;
    data: Record<string, unknown>;
    timestamp: string;
  }> {
    return this.healthService.check();
  }

  @Get('ready')
  async ready(): Promise<{
    statusCode: number;
    message: string;
    data: Record<string, unknown>;
    timestamp: string;
  }> {
    return this.healthService.ready();
  }

  @Get('live')
  async live(): Promise<{
    statusCode: number;
    message: string;
    data: Record<string, unknown>;
    timestamp: string;
  }> {
    return this.healthService.live();
  }
}
