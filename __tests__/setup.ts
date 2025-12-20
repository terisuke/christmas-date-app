// Jest setup file for unit and component tests

// Mock console to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: originalConsole.log,
  info: originalConsole.info,
};

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: '...うん' } }],
    }),
  })
) as jest.Mock;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});
