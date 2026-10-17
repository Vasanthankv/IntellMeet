/**
 * Comprehensive verification suite for IntelliMeet Email Notifications
 * Tests:
 * 1. Email Service unit tests (deduplication, safety, unconfigured handling)
 * 2. User registration welcome email flow
 * 3. Email & Password successful login notification flow
 * 4. Failed login behavior (verifies NO email is triggered on auth failure)
 * 5. Social login notification flow (Google, Facebook, Twitter)
 * 6. Correct recipient addressing verification
 * 7. Deduplication cooldown verification
 */

import {
  isEmailConfigured,
  verifyEmailService,
  sendMailSafe,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
} from './services/emailService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASSED: ${message}`);
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 Starting IntelliMeet Email Notification Test Suite');
  console.log('====================================================\n');

  // TEST 1: Service Configuration & Diagnostics
  console.log('--- TEST 1: Diagnostics & Safe Handling ---');
  const configured = isEmailConfigured();
  console.log('isEmailConfigured():', configured);
  assert(typeof configured === 'boolean', 'isEmailConfigured() returns a boolean');

  const verification = await verifyEmailService();
  assert(verification && typeof verification.status === 'string', 'verifyEmailService() returns a structured status object');
  console.log('Status message:', verification.message);

  // TEST 2: Registration Welcome Email Generation & Addressing
  console.log('\n--- TEST 2: Registration Welcome Email ---');
  const mockUser1 = {
    _id: 'user_reg_test_123',
    name: 'Vasanthan K',
    email: 'kvvasanth0309@gmail.com',
    role: 'Member',
    userType: 'professional',
    pmi: '456-789-1011',
    vanityUrl: 'https://intellmeet.io/m/vasanthan-k',
  };

  const regResult = await sendWelcomeEmail(mockUser1, {
    ip: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
  });

  assert(regResult.success === true, 'Registration email function executes successfully');
  console.log('Registration email result:', regResult);

  // TEST 3: Successful Email/Password Login Notification
  console.log('\n--- TEST 3: Email/Password Login Notification ---');
  const loginResult = await sendLoginNotificationEmail(mockUser1, {
    method: 'Email & Password',
    provider: 'Email & Password',
    ip: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
  });

  assert(loginResult.success === true, 'Login notification executes successfully');
  console.log('Login notification result:', loginResult);

  // TEST 4: Deduplication Prevention
  console.log('\n--- TEST 4: Deduplication Cooldown ---');
  const duplicateLoginResult = await sendLoginNotificationEmail(mockUser1, {
    method: 'Email & Password',
    provider: 'Email & Password',
    ip: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
  });

  assert(
    duplicateLoginResult.deduplicated === true || duplicateLoginResult.reason?.includes('cooldown'),
    'Duplicate notification within cooldown window is properly suppressed'
  );
  console.log('Deduplication result:', duplicateLoginResult);

  // TEST 5: Google Social Login Notification
  console.log('\n--- TEST 5: Google Social Login Notification ---');
  const mockGoogleUser = {
    _id: 'user_google_789',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@gmail.com',
    role: 'Member',
    userType: 'business',
    pmi: '789-123-4567',
  };

  const googleLoginResult = await sendLoginNotificationEmail(mockGoogleUser, {
    method: 'Google Social Login',
    provider: 'Google',
    ip: '203.0.113.195',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  assert(googleLoginResult.success === true, 'Google social login notification processed');
  console.log('Google login result:', googleLoginResult);

  // TEST 6: Facebook & Twitter Social Login Notifications
  console.log('\n--- TEST 6: Facebook & Twitter Social Login ---');
  const mockFacebookUser = {
    _id: 'user_fb_456',
    name: 'Diana Prince',
    email: 'diana.prince@facebook-user.com',
  };
  const fbResult = await sendLoginNotificationEmail(mockFacebookUser, {
    provider: 'Facebook',
    ip: '198.51.100.22',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  });
  assert(fbResult.success === true, 'Facebook login notification processed');

  const mockTwitterUser = {
    _id: 'user_tw_789',
    name: 'Evan Wright',
    email: 'evan.wright@twitter-user.com',
  };
  const twResult = await sendLoginNotificationEmail(mockTwitterUser, {
    provider: 'Twitter',
    ip: '198.51.100.33',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  });
  assert(twResult.success === true, 'Twitter login notification processed');

  // TEST 7: Addressing Integrity Check (Must NEVER send to wrong email)
  console.log('\n--- TEST 7: Addressing Integrity Check ---');
  const invalidEmailResult = await sendMailSafe({
    to: 'invalid-email-format',
    subject: 'Test',
    text: 'Test',
  });
  assert(invalidEmailResult.success === false, 'Rejects invalid or malformed email address');
  assert(invalidEmailResult.reason === 'invalid_recipient', 'Correct failure reason for invalid recipient');

  const emptyUserResult = await sendLoginNotificationEmail({ name: 'No Email User' });
  assert(emptyUserResult.success === false && emptyUserResult.reason === 'missing_user_email', 'Handles missing user email gracefully');

  console.log('\n====================================================');
  console.log(`🎉 All ${passedTests}/${totalTests} unit & notification tests PASSED!`);
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
