import { Test } from '@nestjs/testing';
import { LoggerModule } from '../logger.module';
import { LOGGER_SERVICE } from '../logger.interface';
import { ConsoleLoggerService } from '../logger.console.service';
import { FileLoggerService } from '../logger.file.service';

describe('LoggerModule', () => {
  const originalLogDriver = process.env.LOG_DRIVER;

  afterEach(async () => {
    if (originalLogDriver === undefined) {
      delete process.env.LOG_DRIVER;
    } else {
      process.env.LOG_DRIVER = originalLogDriver;
    }
  });

  it('should register console logger by default', async () => {
    delete process.env.LOG_DRIVER;

    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.register()],
    }).compile();

    const logger = moduleRef.get(LOGGER_SERVICE);

    expect(logger).toBeInstanceOf(ConsoleLoggerService);

    await moduleRef.close();
  });

  it('should register file logger when LOG_DRIVER=file', async () => {
    process.env.LOG_DRIVER = 'file';

    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.register()],
    }).compile();

    const logger = moduleRef.get(LOGGER_SERVICE);

    expect(logger).toBeInstanceOf(FileLoggerService);

    await moduleRef.close();
  });

  it('should fallback to console logger for unsupported driver', async () => {
    process.env.LOG_DRIVER = 'unsupported';

    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.register()],
    }).compile();

    const logger = moduleRef.get(LOGGER_SERVICE);

    expect(logger).toBeInstanceOf(ConsoleLoggerService);

    await moduleRef.close();
  });
});
