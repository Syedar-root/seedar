export const createRepositoryMock = <T = any>() =>
  ({
    create: jest.fn((value: unknown) => value as T),
    save: jest.fn(async (value: unknown) => value as T),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  }) as any;

export const createLoggerMock = () =>
  ({
    setContext: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }) as any;
