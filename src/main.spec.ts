type EnvKey = 'NODE_ENV' | 'PORT' | 'BOOTSTRAP_IN_TEST';
type EnvState = Partial<Record<EnvKey, string | undefined>>;

const flushPromises = async (): Promise<void> => {
  await new Promise<void>((resolve) => setImmediate(resolve));
};

const captureEnv = (): EnvState => ({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  BOOTSTRAP_IN_TEST: process.env.BOOTSTRAP_IN_TEST,
});

const applyEnv = (overrides: EnvState): void => {
  (['NODE_ENV', 'PORT', 'BOOTSTRAP_IN_TEST'] as EnvKey[]).forEach((key) => {
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};

const restoreEnv = (state: EnvState): void => {
  applyEnv(state);
};

interface MainTestContext {
  module: typeof import('./main');
  listenMock: jest.Mock;
  createSpy: jest.SpyInstance;
  cleanup: () => void;
}

const loadMainWithMocks = async (env: EnvState): Promise<MainTestContext> => {
  const snapshot = captureEnv();
  applyEnv(env);

  let moduleRef: typeof import('./main') | undefined;
  let listenMock: jest.Mock | undefined;
  let createSpy: jest.SpyInstance | undefined;

  await jest.isolateModulesAsync(async () => {
    const { NestFactory } = await import('@nestjs/core');

    listenMock = jest.fn().mockResolvedValue(undefined);
    createSpy = jest.spyOn(NestFactory, 'create').mockResolvedValue({
      listen: listenMock,
    } as unknown as import('@nestjs/common').INestApplication);

    moduleRef = await import('./main');
    await flushPromises();
  });

  const cleanup = (): void => {
    createSpy?.mockRestore();
    restoreEnv(snapshot);
    jest.resetModules();
    jest.clearAllMocks();
  };

  return {
    module: moduleRef!,
    listenMock: listenMock!,
    createSpy: createSpy!,
    cleanup,
  };
};

describe('Main bootstrap', () => {
  it('khởi động bằng PORT chỉ định khi BOOTSTRAP_IN_TEST=true', async () => {
    const { createSpy, listenMock, cleanup } = await loadMainWithMocks({
      NODE_ENV: 'test',
      BOOTSTRAP_IN_TEST: 'true',
      PORT: '4567',
    });

    try {
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(expect.any(Function));
      expect(listenMock).toHaveBeenCalledWith('4567');
    } finally {
      cleanup();
    }
  });

  it('fallback về cổng mặc định 3000 khi không có PORT', async () => {
    const { createSpy, listenMock, cleanup } = await loadMainWithMocks({
      NODE_ENV: 'test',
      BOOTSTRAP_IN_TEST: 'true',
    });

    try {
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(expect.any(Function));
      expect(listenMock).toHaveBeenCalledWith('3000');
    } finally {
      cleanup();
    }
  });

  it('không tự bootstrap khi BOOTSTRAP_IN_TEST=false, nhưng bootstrap() thủ công vẫn chạy', async () => {
    const { module, createSpy, listenMock, cleanup } = await loadMainWithMocks({
      NODE_ENV: 'test',
      BOOTSTRAP_IN_TEST: 'false',
    });

    try {
      expect(createSpy).not.toHaveBeenCalled();
      expect(listenMock).not.toHaveBeenCalled();

      await module.bootstrap();
      await flushPromises();

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(expect.any(Function));
      expect(listenMock).toHaveBeenCalledWith('3000');
    } finally {
      cleanup();
    }
  });
});
