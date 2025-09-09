import { createServer } from '../server';
import { FastifyInstance } from 'fastify';
import axios from 'axios';

let server: FastifyInstance | null | true = null;
const TEST_PORT = 19880;

export const getTestServer = async () => {
    if (!server) {
        server = true
        //console.log('Creating test server...');
        server = await createServer();
        console.log('Test server started');
        await server.listen({ port: TEST_PORT });
        //console.log(`Test server started on port ${TEST_PORT}`);
    }

    return server;
};

export const closeTestServer = async (): Promise<void> => {
    if (server && server !== true) {
        //console.log('Closing test server...');
        await server.close();
        server = null;
        //console.log('Test server closed');
    }
};

const users = {
    'manager': { username: 'johndoe', password: '12345678', token: null },
    'supervisor': { username: 'janedoe', password: '12345678', token: null },
    'staff': { username: 'jamesdoe', password: '12345678', token: null },
}


export const getUser = async (role: string): Promise<any> => {

    if (!users[role]) {
        throw new Error(`Role "${role}" not found`);
    }

    if (users[role].token) {
        return users[role];
    }
    
    const { username, password } = users[role];

    const response = await api('post', '/api/v1/me/login', {
        username,
        password,
    });
    
    if (!response.ok) {
        throw new Error(`Login failed for ${role}: ${response.data}`);
    }

    users[role].token = response.data.jwt;
 
    return users[role];
};

export const getTestUrl = () => `http://localhost:${TEST_PORT}`;

export async function api(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, data?: unknown, token?: string) {
    try {
        const { status, data: responseData, headers } = await axios({
        method,
        url: `${getTestUrl()}${path}`,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        data: data ? JSON.stringify(data) : undefined,
    });
        return {
            ok: true,
            status,
            data: responseData,
            headers,
        };
    } catch (error: any) {
        if (error.response) {
            return {
                ok: false,
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            };
        } else {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

export const apix = {
    get: async (url: string, token: string) => {
        return await api('get', url, null, token);
    },
    post: async (url: string, data: unknown, token: string) => {
        return await api('post', url, data, token);
    },
    put: async (url: string, data: unknown, token: string) => {
        return await api('put', url, data, token);
    },
    patch: async (url: string, data: unknown, token: string) => {
        return await api('patch', url, data, token);
    },
    delete: async (url: string, token: string) => {
        return await api('delete', url, null, token);
    },
}