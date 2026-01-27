import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Your verified email address for testing
const VERIFIED_EMAIL = 'paulobinna493@gmail.com';  // Updated to correct address

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');

    // console.log('Testing email configuration...', {
    //   environment: {
    //     NODE_ENV: process.env.NODE_ENV,
    //     HAS_RESEND_KEY: !!process.env.RESEND_API_KEY,
    //     SMTP_FROM: process.env.SMTP_FROM,
    //     APP_URL: process.env.NEXT_PUBLIC_APP_URL
    //   }
    // });

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Always send to verified email
    const emailTo = VERIFIED_EMAIL;
    const fromEmail = process.env.SMTP_FROM || 'onboarding@resend.dev';

    // Send test email
    const result = await resend.emails.send({
      from: fromEmail,
      to: emailTo,
      subject: 'Test Email from Exam Scheduler',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email sent at ${new Date().toISOString()}</p>
          ${testEmail ? `
          <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0;">
            <strong>Development Mode Notice:</strong><br>
            This email was originally intended for: ${testEmail}<br>
            You're receiving this because you're the verified test email address.
          </div>
          ` : ''}
          <p>If you receive this email, it means:</p>
          <ul>
            <li>Your Resend API key is valid</li>
            <li>Email sending is working</li>
            <li>The configuration is correct</li>
          </ul>
          <p><strong>Email Details:</strong></p>
          <ul>
            ${testEmail ? `<li>Intended Recipient: ${testEmail}</li>` : ''}
            <li>Actual Recipient: ${emailTo}</li>
            <li>From: ${fromEmail}</li>
            <li>Environment: ${process.env.NODE_ENV}</li>
          </ul>
        </div>
      `,
      text: 'This is a test email to verify your email configuration is working.'
    });

    // console.log('Raw API Response:', result);

    if (result.error) {
      throw new Error(`Resend API Error: ${result.error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        emailId: result.data?.id,
        to: emailTo,
        intendedRecipient: testEmail || emailTo,
        from: fromEmail,
        isDevelopment: process.env.NODE_ENV === 'development'
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
      details: error,
      note: process.env.NODE_ENV === 'development'
        ? 'All emails are being sent to the verified email address in development mode.'
        : undefined
    }, {
      status: 500
    });
  }
}
