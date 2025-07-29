# Email Setup Guide

## Option 1: Using Gmail with App Password (Recommended)

1. Enable 2-Step Verification on your Gmail account:
   - Go to your Google Account settings
   - Click on "Security"
   - Enable "2-Step Verification"

2. Generate an App Password:
   - Go to your Google Account settings
   - Click on "Security"
   - Under "2-Step Verification", click on "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Exam Scheduler"
   - Click "Generate"
   - Copy the 16-character password

3. Update your .env file:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="your-16-digit-app-password"
SMTP_FROM="Your Name <your-gmail@gmail.com>"
SMTP_SECURE="false"
```

## Option 2: Using Gmail with Regular Password (Less Secure)

1. Enable Less Secure App Access:
   - Go to your Google Account settings
   - Click on "Security"
   - Scroll to "Less secure app access"
   - Turn it ON (Note: This is not recommended for production)

2. Update your .env file:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="your-regular-gmail-password"
SMTP_FROM="Your Name <your-gmail@gmail.com>"
SMTP_SECURE="true"
```

## Testing Your Setup

1. After setting up either option, restart your development server.

2. Test the email configuration:
   - Go to http://localhost:3000/test-email
   - Enter your email address
   - Click "Send Test Email"

3. Check your inbox for the test email.

## Troubleshooting

If you encounter errors:

1. "ECONNREFUSED" error:
   - Check if your SMTP credentials are correct
   - Make sure you've enabled the appropriate access (App Password or Less Secure Apps)
   - Verify your email and password in .env file

2. Authentication failed:
   - For App Password: Make sure you're using the correct 16-character app password
   - For Regular Password: Ensure Less Secure App Access is enabled

3. Timeout errors:
   - Check your internet connection
   - Verify that port 587 (for TLS) or 465 (for SSL) is not blocked by your firewall
