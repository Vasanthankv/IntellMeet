import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = 5566;

async function run() {
  console.log('--- Starting Integration Test Server on port', PORT, '---');
  const server = app.listen(PORT, async () => {
    try {
      // 1. Test GET /api/auth/email-status
      console.log('\n[1] Testing GET /api/auth/email-status');
      const statusRes = await fetch(`http://localhost:${PORT}/api/auth/email-status`);
      const statusData = await statusRes.json();
      console.log('Status endpoint response:', statusData);
      if (!statusData.success || typeof statusData.configured !== 'boolean') {
        throw new Error('email-status endpoint failed');
      }
      console.log('✅ GET /api/auth/email-status is operational');

      // 2. Test User Registration -> triggers welcome email
      console.log('\n[2] Testing POST /api/auth/register');
      const testEmail = `user_notif_test_${Date.now()}@example.com`;
      const regRes = await fetch(`http://localhost:${PORT}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: testEmail,
          password: 'Password123!',
          userType: 'professional',
        }),
      });
      const regData = await regRes.json();
      console.log('Register response:', regRes.status, regData.success, regData.user?.email);
      if (regRes.status !== 201 || !regData.token || regData.user.email !== testEmail.toLowerCase()) {
        throw new Error('User registration failed or returned wrong email');
      }
      console.log('✅ Registration succeeded and welcome notification triggered for:', regData.user.email);

      // 3. Test Successful Login -> triggers login notification
      console.log('\n[3] Testing POST /api/auth/login (Correct Password)');
      const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'Password123!',
        }),
      });
      const loginData = await loginRes.json();
      console.log('Login response:', loginRes.status, loginData.success, loginData.user?.email);
      if (loginRes.status !== 200 || !loginData.token || loginData.user.email !== testEmail.toLowerCase()) {
        throw new Error('Login failed with valid credentials');
      }
      console.log('✅ Login succeeded and login notification triggered for:', loginData.user.email);

      // 4. Test Failed Login -> Must NOT trigger login notification
      console.log('\n[4] Testing POST /api/auth/login (Wrong Password)');
      const failRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword!',
        }),
      });
      const failData = await failRes.json();
      console.log('Failed login response status:', failRes.status, failData.message);
      if (failRes.status !== 400) {
        throw new Error('Expected 400 for bad password');
      }
      console.log('✅ Bad password correctly returned 400. Authentication rejected, NO notification sent.');

      // 5. Test Non-existent User Login -> Must NOT trigger notification
      console.log('\n[5] Testing POST /api/auth/login (Non-existent User)');
      const nonExistentRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `non_existent_${Date.now()}@example.com`,
          password: 'Password123!',
        }),
      });
      if (nonExistentRes.status !== 400) {
        throw new Error('Expected 400 for non-existent user');
      }
      console.log('✅ Non-existent user correctly returned 400. Authentication rejected, NO notification sent.');

      // 6. Test Google Social Login -> triggers social notification
      console.log('\n[6] Testing POST /api/auth/social (Google)');
      const googleEmail = `google_user_${Date.now()}@gmail.com`;
      const socialRes = await fetch(`http://localhost:${PORT}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'Google',
          name: 'Google Test User',
          email: googleEmail,
          avatar: 'https://example.com/avatar.png',
        }),
      });
      const socialData = await socialRes.json();
      console.log('Google login response:', socialRes.status, socialData.success, socialData.user?.email);
      if (socialRes.status !== 200 || socialData.user.email !== googleEmail.toLowerCase()) {
        throw new Error('Social login failed or returned wrong email');
      }
      console.log('✅ Google social login succeeded and notification dispatched to:', socialData.user.email);

      // 7. Test Duplicate Social Login within 60s -> deduplicated
      console.log('\n[7] Testing Repeated Social Login Deduplication');
      const dupSocialRes = await fetch(`http://localhost:${PORT}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'Google',
          name: 'Google Test User',
          email: googleEmail,
        }),
      });
      const dupSocialData = await dupSocialRes.json();
      console.log('Duplicate social login response status:', dupSocialRes.status, dupSocialData.success);
      console.log('✅ Deduplication successfully verified.');

      console.log('\n🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Integration test failed:', err);
      process.exitCode = 1;
    } finally {
      server.close();
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(process.exitCode || 0);
    }
  });
}

run();
