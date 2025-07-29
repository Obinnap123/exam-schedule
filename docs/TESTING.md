# Testing Authentication & Email Verification

## Prerequisites
1. Set up email configuration in `.env`:
   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   SMTP_HOST="your-smtp-host"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email"
   SMTP_PASSWORD="your-password"
   SMTP_FROM="Your Name <your-email>"
   ```

## Test Steps

### 1. Test Email Configuration
1. Navigate to `/test-email`
2. Click "Test Email Configuration"
3. Expected: Success message if SMTP settings are correct

### 2. Test Registration Flow
1. Navigate to `/signup`
2. Test form validation:
   - Try submitting without required fields
   - Try weak passwords
   - Try invalid email formats
   - Try submitting with mismatched passwords
3. Register with valid details:
   - First name, last name
   - Valid email
   - Strong password
4. Expected: Success message and prompt to verify email

### 3. Test Email Verification
1. Check your email for verification link
2. Click the verification link
3. Expected: Success page confirming verification
4. Try the verification link again
   - Expected: Error message (token already used)

### 4. Test Login Flow
1. Try logging in with unverified account
   - Expected: Error message about verification needed
   - Should see option to resend verification email
2. Try logging in with verified account
   - Should succeed and redirect to dashboard
3. Test "Remember Me" functionality
   - Login with "Remember Me" checked
   - Close browser and reopen
   - Expected: Should still be logged in

### 5. Test Rate Limiting
1. Try incorrect password multiple times
   - Expected: Warning about remaining attempts
   - After 5 attempts: Timeout message
2. Wait for timeout or try different account
   - Expected: Should be able to try again after timeout

### 6. Test Verification Email Resend
1. Try to login with unverified account
2. Click "Resend verification email"
3. Expected: Success message about email sent
4. Check email for new verification link
5. Verify it works

### 7. Edge Cases
1. Try expired verification links
   - Wait 24 hours or modify token expiry in database
   - Expected: Error message about expired token
2. Try invalid verification tokens
   - Modify the token in the URL
   - Expected: Error message about invalid token
3. Try registering with existing email
   - Expected: Error message about email in use

## Common Issues

### Email Not Received
1. Check spam folder
2. Verify SMTP settings in `.env`
3. Check server logs for SMTP errors
4. Try test email configuration page

### Verification Link Not Working
1. Check `NEXT_PUBLIC_APP_URL` is correct
2. Ensure token hasn't expired
3. Check if account is already verified

### Rate Limiting Issues
1. Clear rate limit by restarting server (development only)
2. Check for proper error messages
3. Verify timeout duration is working

## Security Checklist
- [ ] Password requirements enforced
- [ ] Email verification required
- [ ] Rate limiting working
- [ ] No email enumeration possible
- [ ] Secure password storage (hashing)
- [ ] Remember Me token secure
- [ ] Verification tokens expire properly

## Development Testing Tips
1. Use development SMTP service (like Mailtrap)
2. Monitor server logs for errors
3. Use incognito mode for testing sessions
4. Test with multiple accounts
5. Test with various email providers
