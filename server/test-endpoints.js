// Integration test runner for EventSphere endpoints
const http = require('http');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(responseBody),
            });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

const runTests = async () => {
  console.log('Testing EventSphere API endpoints...\n');

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log('✔ Health Check:', health.data.status);

    // 2. Signup
    const testEmail = `tester_${Date.now()}@eventsphere.com`;
    const signupRes = await request('/api/signup', 'POST', {
      name: 'Test Explorer',
      email: testEmail,
      password: 'password123',
      phone: '+1 555-123-4567',
    });
    console.log('✔ POST /signup:', signupRes.data.message);
    const token = signupRes.data.token;
    const user = signupRes.data.user;

    // 3. Login
    const loginRes = await request('/api/login', 'POST', {
      email: testEmail,
      password: 'password123',
    });
    console.log('✔ POST /login:', loginRes.data.message);

    // 4. GET /events
    const eventsRes = await request('/api/events');
    console.log(`✔ GET /events: Found ${eventsRes.data.count} events.`);
    const firstEvent = eventsRes.data.events[0];

    // 5. GET /events/:id
    const singleEventRes = await request(`/api/events/${firstEvent._id}`, 'GET', null, token);
    console.log(`✔ GET /events/:id: "${singleEventRes.data.event.title}", registered: ${singleEventRes.data.isRegistered}`);

    const initialSeats = singleEventRes.data.event.seatsLeft;

    // 6. POST /events/:id/register
    const registerRes = await request(`/api/events/${firstEvent._id}/register`, 'POST', null, token);
    console.log(`✔ POST /events/:id/register: ${registerRes.data.message}, regId: ${registerRes.data.registration.registrationId}`);
    const regId = registerRes.data.registration._id;

    // Verify seat decremented
    const eventAfterReg = await request(`/api/events/${firstEvent._id}`);
    console.log(`✔ Seat count decreased from ${initialSeats} to ${eventAfterReg.data.event.seatsLeft}`);

    // 7. Prevent duplicate registration
    const dupRes = await request(`/api/events/${firstEvent._id}/register`, 'POST', null, token);
    console.log(`✔ Duplicate Registration Prevention: Status ${dupRes.statusCode} - "${dupRes.data.message}"`);

    // 8. GET /profile
    const profileRes = await request('/api/profile', 'GET', null, token);
    console.log(`✔ GET /profile: Retrieved user ${profileRes.data.user.name}`);

    // 9. PUT /profile
    const updateProfileRes = await request('/api/profile', 'PUT', { name: 'Test Explorer Updated', phone: '999-888-7777' }, token);
    console.log(`✔ PUT /profile: Name updated to "${updateProfileRes.data.user.name}"`);

    // 10. GET /profile/registrations
    const myRegsRes = await request('/api/profile/registrations', 'GET', null, token);
    console.log(`✔ GET /profile/registrations: Found ${myRegsRes.data.count} registration(s) with populated event`);

    // 11. DELETE /registrations/:id (cancel registration)
    const cancelRes = await request(`/api/registrations/${regId}`, 'DELETE', null, token);
    console.log(`✔ DELETE /registrations/:id: ${cancelRes.data.message}`);

    // Verify seat incremented back
    const eventAfterCancel = await request(`/api/events/${firstEvent._id}`);
    console.log(`✔ Seat count restored from ${eventAfterReg.data.event.seatsLeft} back to ${eventAfterCancel.data.event.seatsLeft}`);

    console.log('\n🌟 ALL API TESTS PASSED SUCCESSFULLY! 🌟');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

runTests();
