import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.check();
  }

  @Get('ready')
  async ready() {
    return this.healthService.ready();
  }

  @Get('live')
  async live() {
    return this.healthService.live();
  }
}
