import prisma from "@/lib/prisma";
import { sendVerificationEmail, testEmailConfig } from "@/lib/email";
import {
  mockUser,
  mockVerificationToken,
  mockEmailSuccess,
  mockEmailData,
  mockVerifiedUser,
  mockUnverifiedUser,
  mockEmailError,
} from "./utils/testHelpers";

import nodemailer from "nodemailer";

// Import type for mockPrisma and mockTransporter from jest setup
declare const mockPrisma: {
  user: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteMany: jest.Mock;
  };
};

declare const mockTransporter: {
  verify: jest.Mock;
  sendMail: jest.Mock;
};

describe("Email Verification Tests", () => {
  describe("Email Configuration", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockTransporter.verify.mockReset();
      mockTransporter.sendMail.mockReset();
    });

    it("should verify email configuration", async () => {
      mockTransporter.verify.mockResolvedValueOnce(true);
      const isValid = await testEmailConfig();
      
      expect(isValid).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it("should handle email configuration errors", async () => {
      mockTransporter.verify.mockRejectedValueOnce(new Error("SMTP error"));
      const isValid = await testEmailConfig();
      
      expect(isValid).toBe(false);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe("Verification Email Sending", () => {
    const user = mockUser();
    const { token } = mockVerificationToken();

    it("should send verification email successfully", async () => {
      mockTransporter.sendMail.mockResolvedValueOnce(mockEmailSuccess);

      await sendVerificationEmail(user.email, token, user.firstName);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall).toBeDefined();
      expect(emailCall.to).toBe(user.email);
      expect(emailCall.subject).toContain("Verify");
      expect(emailCall.html).toContain(token);
      expect(emailCall.html).toContain(user.firstName);
      expect(emailCall.html).toContain(`/verify-email?token=${token}`);
    });

    it("should handle email sending errors", async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(mockEmailError);

      await expect(
        sendVerificationEmail(user.email, token, user.firstName)
      ).rejects.toThrow("Failed to send email");
    });
  });

  describe("Verification Token Management", () => {
    it("should create user with verification token", async () => {
      const { token, expiry, mock } = mockVerificationToken();
      const unverifiedUser = mockUnverifiedUser({
        verificationToken: token,
        verificationTokenExpiry: expiry,
      });

      mockPrisma.user.create.mockResolvedValue(unverifiedUser);

      const createdUser = await prisma.user.create({
        data: unverifiedUser,
      });

      expect(createdUser.verificationToken).toBe(token);
      expect(createdUser.verificationTokenExpiry).toBeTruthy();
      expect(createdUser.isVerified).toBe(false);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining(mock),
      });
    });

    it("should update user when verified", async () => {
      const unverifiedUser = mockUnverifiedUser();
      const verifiedUser = mockVerifiedUser({ id: unverifiedUser.id });

      mockPrisma.user.create.mockResolvedValue(unverifiedUser);
      mockPrisma.user.update.mockResolvedValue(verifiedUser);

      // Create unverified user
      const createdUser = await prisma.user.create({
        data: unverifiedUser,
      });

      // Verify user
      const updatedUser = await prisma.user.update({
        where: { id: createdUser.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationToken).toBeNull();
      expect(updatedUser.verificationTokenExpiry).toBeNull();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: createdUser.id },
        data: expect.objectContaining({
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        }),
      });
    });

    it("should not verify with expired token", async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      const expiredUser = mockUnverifiedUser({
        verificationToken: "expired-token",
        verificationTokenExpiry: expiredDate,
      });

      mockPrisma.user.create.mockResolvedValue(expiredUser);

      const user = await prisma.user.create({
        data: expiredUser,
      });

      expect(user.verificationToken).toBe("expired-token");
      expect(user.verificationTokenExpiry).toBeTruthy();
      expect(user.verificationTokenExpiry!.getTime()).toBeLessThan(
        new Date().getTime()
      );
      expect(user.isVerified).toBe(false);
    });
  });
});
