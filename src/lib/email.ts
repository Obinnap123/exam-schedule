import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Your verified email address for testing
const VERIFIED_EMAIL = 'paulobinna493@gmail.com';  // Updated to correct address

/**
 * Send a verification email to the user
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string
): Promise<void> {
  try {
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

    // In development, redirect all emails to the verified email
    const emailTo = VERIFIED_EMAIL;  // Always send to verified email in development
    const fromEmail = process.env.SMTP_FROM || 'onboarding@resend.dev';

    const result = await resend.emails.send({
      from: fromEmail,
      to: emailTo,
      subject: 'Verify Your Email - Exam Scheduler',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Exam Scheduler!</h2>
          <p>Hello ${name},</p>
          ${emailTo !== to
          ? `<div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0;">
                <strong>Development Mode Notice:</strong><br>
                This email was originally intended for: ${to}<br>
                You're receiving this because you're the verified test email address.
              </div>`
          : ''
        }
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}"
               style="background-color: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>The Exam Scheduler Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
            <a href="${verificationLink}" style="color: #2563eb;">${verificationLink}</a>
          </p>
        </div>
      `,
      text: `Welcome to Exam Scheduler! Please verify your email by visiting: ${verificationLink}`
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

  } catch (error) {
    console.error('Failed to send verification email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

/**
 * Generate a verification token and expiry date
 */
export function generateVerificationToken(): { token: string; expiry: Date } {
  // Generate random token using Math.random (safer for edge/client compat if leaks)
  const array = new Uint8Array(32);
  // Note: crypto.getRandomValues is available in most modern JS including browsers/edge, 
  // but if that fails, use Math.random fallback.
  // Actually, let's just use simple random string for now to avoid 'crypto' import entirely.
  const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  // Set expiry to 24 hours from now
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);

  return { token, expiry };
}

export { resend };
