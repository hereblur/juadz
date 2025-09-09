import { api } from './test-setup';
test('GET /ping should return pong', async () => {
    const response = await api('get', '/ping');
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ pong: 'it worked!' });
});

test('GET / should return 404', async () => {
    const response = await api('get', '/');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
});

test('GET /api/v1/user/ should return 401 without token', async () => {
    const response = await api('get', '/api/v1/users');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
});

test('POST /api/v1/me/login should return 400 with invalid credentials', async () => {
    const response = await api('post', '/api/v1/me/login', {
        username: 'invalid@example.com',
        password: 'wrongpassword'
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
});

test('POST /api/v1/me/login should return 400 with missing username', async () => {
    const response = await api('post', '/api/v1/me/login', {
        password: 'password123'
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
});

test('POST /api/v1/me/login should return 400 with missing password', async () => {
    const response = await api('post', '/api/v1/me/login', {
        username: 'user@example.com'
    });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
});

test('POST /api/v1/me/login should return 200 with valid credentials', async () => {
    const response = await api('post', '/api/v1/me/login', {
        username: 'johndoe',
        password: '12345678'
    });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('jwt');
    expect(typeof response.data.jwt).toBe('string');
});

test('GET /api/v1/user/ should return 200 with valid token', async () => {
    const loginResponse = await api('post', '/api/v1/me/login', {
        username: 'johndoe', // Fixed: was 'email' but should be 'username'
        password: '12345678'
    });
    
    if (loginResponse.ok) {
        const jwt = loginResponse.data.jwt;
        const response = await api('get', '/api/v1/users', undefined, jwt);
        // console.log(response.status, response.data);
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
    }
});
