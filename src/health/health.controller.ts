import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';
import {
  HealthCheckDto,
  ReadinessDto,
  LivenessDto,
} from './dto/health-check.dto';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthCheckDto> {
    return this.healthService.check();
  }

  @Get('ready')
  async ready(): Promise<ReadinessDto> {
    return this.healthService.ready();
  }

  @Get('live')
  async live(): Promise<LivenessDto> {
    return this.healthService.live();
  }
}
