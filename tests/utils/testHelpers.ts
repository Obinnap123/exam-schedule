import { User } from '@prisma/client';

/**
 * Create a mock user object for testing
 */
export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isVerified: false,
    verificationToken: null,
    verificationTokenExpiry: null,
    rememberToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Generate a valid verification token object
 */
export function mockVerificationToken() {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  
  return {
    token: 'test-verification-token',
    expiry,
    mock: {
      verificationToken: 'test-verification-token',
      verificationTokenExpiry: expiry,
      isVerified: false
    }
  };
}

/**
 * Create a mock API response
 */
export function mockApiResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Generate a verified user mock
 */
export function mockVerifiedUser(overrides: Partial<User> = {}): User {
  return mockUser({
    isVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
    ...overrides
  });
}

/**
 * Generate an unverified user mock
 */
export function mockUnverifiedUser(overrides: Partial<User> = {}): User {
  const { token, expiry } = mockVerificationToken();
  return mockUser({
    isVerified: false,
    verificationToken: token,
    verificationTokenExpiry: expiry,
    ...overrides
  });
}

/**
 * Create a mock request object
 */
export function mockRequest(method: string, body?: any, searchParams?: URLSearchParams) {
  const req = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    json: jest.fn().mockResolvedValue(body),
    url: searchParams 
      ? `http://localhost:3000/api/test?${searchParams.toString()}`
      : 'http://localhost:3000/api/test'
  };
  return req;
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(date: Date, expectedDate: Date, toleranceMs: number = 1000): boolean {
  const diff = Math.abs(date.getTime() - expectedDate.getTime());
  return diff <= toleranceMs;
}

/**
 * Generate test email data
 */
export function mockEmailData() {
  return {
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<p>This is a test email</p>'
  };
}

/**
 * Mock successful email response
 */
export const mockEmailSuccess = {
  accepted: ['test@example.com'],
  rejected: [],
  response: '250 Message accepted',
  messageId: '<test-message-id@example.com>'
};

/**
 * Mock email error
 */
export const mockEmailError = new Error('Failed to send email');
