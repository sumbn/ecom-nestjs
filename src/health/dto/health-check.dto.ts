export class HealthCheckDto {
  status: string;
  timestamp: string;
  uptime: number;
  environment?: string;
  version?: string;
  database: string;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  responseTime?: string;
  error?: string;
}

export class ReadinessDto {
  status: string;
  timestamp: string;
  database: string;
  error?: string;
}

export class LivenessDto {
  status: string;
  timestamp: string;
  uptime: number;
}
