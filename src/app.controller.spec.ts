import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let appController: AppController;
  let dataSourceMock: { query: jest.Mock };

  beforeEach(async () => {
    dataSourceMock = {
      query: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when database query succeeds', async () => {
      dataSourceMock.query.mockResolvedValueOnce(undefined);
      const uptimeSpy = jest.spyOn(process, 'uptime').mockReturnValue(123.456);

      const result = await appController.healthCheck();

      expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT 1');
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBe(123.456);

      uptimeSpy.mockRestore();
    });

    it('should return error status when database query fails', async () => {
      const error = new Error('DB connection failed');
      dataSourceMock.query.mockRejectedValueOnce(error);

      const result = await appController.healthCheck();

      expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT 1');
      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.error).toBe('DB connection failed');
      expect(result.timestamp).toBeDefined();
    });
  });
});
