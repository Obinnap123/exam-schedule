// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.SMTP_FROM = 'Test User <test@example.com>';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

// Reset all mocks before each test
beforeEach(() => {
  // Reset Prisma mocks
  Object.values(mockPrisma.user).forEach(mock => mock.mockReset());
  
  // Setup default mock implementations
  mockPrisma.user.create.mockImplementation(({ data }) => Promise.resolve({ ...data }));
  mockPrisma.user.update.mockImplementation(({ data }) => Promise.resolve({ ...data }));
  mockPrisma.user.findUnique.mockImplementation(() => Promise.resolve(null));
  mockPrisma.user.deleteMany.mockImplementation(() => Promise.resolve({ count: 1 }));
});

// Make mockPrisma available globally for tests
global.mockPrisma = mockPrisma;

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue(true),
  verify: jest.fn().mockResolvedValue(true),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// Make mockTransporter available globally for tests
global.mockTransporter = mockTransporter;

// Global beforeEach to clear mocks
beforeEach(() => {
  jest.clearAllMocks();
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
