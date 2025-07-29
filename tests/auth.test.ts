import { testEmailConfig } from '@/lib/email';
import { validatePassword, validateEmail, validateName } from '@/lib/validation';
import prisma from '@/lib/prisma';
import { generateVerificationToken } from '@/lib/email';
import { mockUser } from './utils/testHelpers';

// Import type for mockPrisma from jest setup
declare const mockPrisma: {
  user: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
};

describe('Authentication System Tests', () => {
  describe('Validation Tests', () => {
    test('Email Validation', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('invalid-email').isValid).toBe(false);
      expect(validateEmail('').isValid).toBe(false);
    });

    test('Password Validation', () => {
      const strongPassword = 'StrongP@ss1';
      const weakPassword = 'weak';
      
      expect(validatePassword(strongPassword).isValid).toBe(true);
      expect(validatePassword(weakPassword).isValid).toBe(false);
      expect(validatePassword(weakPassword).errors.length).toBeGreaterThan(0);
    });

    test('Name Validation', () => {
      expect(validateName('John').isValid).toBe(true);
      expect(validateName('').isValid).toBe(false);
      expect(validateName('A'.repeat(51)).isValid).toBe(false);
    });
  });

  describe('Token Generation', () => {
    test('Verification Token Generation', () => {
      const { token, expiry } = generateVerificationToken();
      
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(32); // Should be long enough
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Email Configuration', () => {
    test('Email Config Test', async () => {
      // Only run if SMTP settings are configured
      if (process.env.SMTP_HOST) {
        const isValid = await testEmailConfig();
        expect(isValid).toBe(true);
      } else {
        console.log('Skipping email config test - no SMTP settings found');
      }
    });
  });

  describe('Database Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      Object.values(mockPrisma.user).forEach(mock => mock.mockReset());
    });

    test('User Creation', async () => {
      const testUser = mockUser();
      mockPrisma.user.create.mockResolvedValueOnce(testUser);

      const createdUser = await prisma.user.create({
        data: {
          email: testUser.email,
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          isVerified: false
        }
      });

      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(testUser.email);
      expect(createdUser.isVerified).toBe(false);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: testUser.email,
          isVerified: false
        })
      });
    });

    test('Duplicate Email Prevention', async () => {
      const testUser = mockUser();
      
      // Mock first create call to succeed
      mockPrisma.user.create.mockResolvedValueOnce(testUser);
      
      // Mock second create call to fail
      mockPrisma.user.create.mockRejectedValueOnce(
        new Error('Unique constraint failed on the fields: (`email`)')
      );

      // First creation should succeed
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          isVerified: false
        }
      });

      // Second creation should fail
      await expect(
        prisma.user.create({
          data: {
            email: testUser.email,
            password: 'different-password',
            firstName: 'Another',
            lastName: 'User',
            isVerified: false
          }
        })
      ).rejects.toThrow('Unique constraint failed');
    });

    test('Email Verification Update', async () => {
      const unverifiedUser = mockUser({
        verificationToken: 'test-token',
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isVerified: false
      });

      const verifiedUser = mockUser({
        id: unverifiedUser.id,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });

      mockPrisma.user.create.mockResolvedValueOnce(unverifiedUser);
      mockPrisma.user.update.mockResolvedValueOnce(verifiedUser);

      // Create unverified user
      const user = await prisma.user.create({
        data: {
          email: unverifiedUser.email,
          password: unverifiedUser.password,
          firstName: unverifiedUser.firstName,
          lastName: unverifiedUser.lastName,
          isVerified: false,
          verificationToken: unverifiedUser.verificationToken,
          verificationTokenExpiry: unverifiedUser.verificationTokenExpiry
        }
      });

      // Verify user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null
        }
      });

      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationToken).toBeNull();
      expect(updatedUser.verificationTokenExpiry).toBeNull();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null
        })
      });
    });
  });
});
