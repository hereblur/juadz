

import { faker } from '@faker-js/faker/.';
import { apix, getTestServer, getUser } from './test-setup';

let server
const tokens = {
    manager: '',
    staff: '',
    supervisor: '',
}

beforeAll(async () => {

    tokens.manager = await getUser('manager').then(user => user.token);
    tokens.staff = await getUser('staff').then(user => user.token);
    tokens.supervisor = await getUser('supervisor').then(user => user.token);
});


// no body can create/update category(404)
//  staff: [
//        "view.user",
//        "view.product",
//        "view.customer",
//        "update.product",
//        "update.customer",
//        "create.customer",
//    ],
//    manager and supervisor: [
//        "view.user",
//        "view.product",
//        "view.customer",
//        "update.user",
//        "update.product",
//        "update.customer",
//        "create.user",
//        "create.product",
//        "create.customer",
//    ],

function newCustomer(){
    return {
        name: faker.person.fullName(),
        tel: faker.phone.number(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
        credits: faker.number.int({ min: 0, max: 1000 }),
    }
}

function newProduct() {
    return {
        category: faker.helpers.arrayElement(['dogfood', 'catfood', 'toy']),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),

        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 0, max: 100 }),
        sku: faker.string.alphanumeric(10),
        image: faker.image.urlLoremFlickr({ category: 'animals' }),
    }   
}

function newUser() {
    return {
        username: faker.internet.username(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        nickname: faker.person.firstName(),
        tel: faker.phone.number(),
        status: 'ACTIVE',
        roles: 'staff',
    }
}

describe('Role-based permissions', () => {
    describe('Staff permissions', () => {
        test('staff can view users', async () => {
            const response = await apix
                .get('/api/v1/users', tokens.staff)
            // console.log(response.data);
            expect(response.status).toBe(200);
            
        });

        test('staff can view products', async () => {
            const response = await apix
                .get('/api/v1/products', tokens.staff)
            expect(response.status).toBe(200);
        });

        test('staff can view customers', async () => {
            const response = await apix
                .get('/api/v1/customers', tokens.staff)
            expect(response.status).toBe(200);
        });

        test('staff can update products', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { name: 'Updated Product' }, tokens.staff)

            expect(response.status).toBe(200);
        });

        test('staff can update customers', async () => {
            const response = await apix
                .patch('/api/v1/customers/1', { name: 'Updated Customer' }, tokens.staff)

            // console.log(response);
            expect(response.status).toBe(200);
        });

        test('staff can create customers', async () => {
            const data = newCustomer()
            const response = await apix
                .post('/api/v1/customers', { ...data }, tokens.staff)

            // console.log(JSON.stringify(response.data), JSON.stringify(data));
            expect(response.status).toBe(201);
        });

        test('staff cannot update users', async () => {
            const response = await apix
                .patch('/api/v1/users/1', { name: 'Updated User' }, tokens.staff)

            expect(response.status).toBe(403);
        });

        test('staff cannot create users', async () => {
            const response = await apix
                .post('/api/v1/users', { ...newUser() }, tokens.staff)

            expect(response.status).toBe(403);
        });

        test('staff cannot create products', async () => {
            const response = await apix
                .post('/api/v1/products', { ...newProduct() }, tokens.staff)

            expect(response.status).toBe(403);
        });
    });

    describe('Manager permissions', () => {
        test('manager can view users', async () => {
            const response = await apix
                .get('/api/v1/users', tokens.manager)
            expect(response.status).toBe(200);
        });

        test('manager can update users', async () => {
            const response = await apix
                .patch('/api/v1/users/1', { nickname: 'Updated User xxx' }, tokens.manager)
            expect(response.status).toBe(200);
        });

        test('manager can create users', async () => {
            const response = await apix
                .post('/api/v1/users', { ...newUser() }, tokens.manager)

            expect(response.status).toBe(201);
        });

        test('manager can create products', async () => {
            const response = await apix
                .post('/api/v1/products', { ...newProduct() }, tokens.manager)

            expect(response.status).toBe(201);
        });
    });

    describe('Supervisor permissions', () => {
        test('supervisor can view users', async () => {
            const response = await apix
                .get('/api/v1/users', tokens.supervisor)
            expect(response.status).toBe(200);
        });

        test('supervisor can update users', async () => {
            const response = await apix
                .patch('/api/v1/users/1', { nickname: 'Updated User' }, tokens.supervisor)

            expect(response.status).toBe(200);
        });

        test('supervisor can create users', async () => {
            const response = await apix
                .post('/api/v1/users', { ...newUser() }, tokens.supervisor)

            expect(response.status).toBe(201);
        });

        test('supervisor can create products', async () => {
            const response = await apix
                .post('/api/v1/products', { ...newProduct() }, tokens.supervisor)

            expect(response.status).toBe(201);
        });
    });

    describe('Category restrictions', () => {
        test('staff cannot create categories', async () => {
            const response = await apix
                .post('/api/v1/categories', { name: 'New Category' }, tokens.staff)

            expect(response.status).toBe(404);
        });

        test('manager cannot create categories', async () => {
            const response = await apix
                .post('/api/v1/categories', { name: 'New Category' }, tokens.manager)

            expect(response.status).toBe(404);
        });

        test('supervisor cannot create categories', async () => {
            const response = await apix
                .post('/api/v1/categories', { name: 'New Category' }, tokens.supervisor)

            expect(response.status).toBe(404);
        });

        test('staff cannot update categories', async () => {
            const response = await apix
                .patch('/api/v1/categories/1', { name: 'Updated Category' }, tokens.staff)

            expect(response.status).toBe(404);
        });

        test('manager cannot update categories', async () => {
            const response = await apix
                .patch('/api/v1/categories/1', { name: 'Updated Category' }, tokens.manager)

            expect(response.status).toBe(404);
        });

        test('supervisor cannot update categories', async () => {
            const response = await apix
                .patch('/api/v1/categories/1', { name: 'Updated Category' }, tokens.supervisor)

            expect(response.status).toBe(404);
        });
    });

    describe('Special persmissions flags', () => {
        // only manager can update products's price/stock/sku
        // only manager can update customer's credits
        // other will get 403, nomatter if they have update producst/customers permissions
        test('staff cannot update product price', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { price: 100 }, tokens.staff)

            expect(response.status).toBe(403);
        });

        test('staff cannot update product stock', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { stock: 50 }, tokens.staff)

            expect(response.status).toBe(403);
        });

        test('staff cannot update product sku', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { sku: 'NEW-SKU-123' }, tokens.staff)

            expect(response.status).toBe(403);
        });

        test('manager can update product price', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { price:   100 }, tokens.manager)

            expect(response.status).toBe(200);
        });

        test('manager can update product stock', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { stock: 50 }, tokens.manager)

            expect(response.status).toBe(200);
        });

        test('manager can update product sku', async () => {
            const response = await apix
                .patch('/api/v1/products/1', { sku: 'NEW-SKU-123' }, tokens.manager)

            expect(response.status).toBe(200);
        });

        test('staff cannot update customer credits', async () => {
            const response = await apix
                .patch('/api/v1/customers/1', { credits: 100 }, tokens.staff)

            expect(response.status).toBe(403);
        });

        test('manager can update customer credits', async () => {
            const response = await apix
                .patch('/api/v1/customers/1', { credits: 100 }, tokens.manager)

            expect(response.status).toBe(200);
        });

        test('supervisor can not update customer credits', async () => {
            const response = await apix
                .patch('/api/v1/customers/1', { credits: 100 }, tokens.supervisor)

            expect(response.status).toBe(403);
        });

        test('staff cannot see user roles', async () => {
            const response = await apix
                .get('/api/v1/users/1', tokens.staff)

            expect(response.status).toBe(200);
            // console.log(response.data)
            expect(response.data.roles).toBeUndefined();
        })

        test('supervisor cannot see user roles', async () => {
            const response = await apix
                .get('/api/v1/users/1', tokens.supervisor)

            expect(response.status).toBe(200);
            expect(response.data.roles).toBeUndefined();
        })

        test('manager can see user roles', async () => {
            const response = await apix
                .get('/api/v1/users/1', tokens.manager)

            expect(response.status).toBe(200);
            // expect(response.data).toEqual({});
            expect(response.data.roles).toBeDefined();
        });
        
        test('staff cannot see password without masked', async () => {
            const response = await apix
                .get('/api/v1/users/1', tokens.staff)

            expect(response.status).toBe(200);
            expect(response.data.password).toBe('********');
        })

        test('supervisor cannot see password without masked', async () => {
            const response = await apix
                .get('/api/v1/users/1', tokens.supervisor)

            expect(response.status).toBe(200);
            expect(response.data.password).toBe('********');
        })

        test('manager cannot see password without masked', async () => {
            const response = await apix
                .get('/api/v1/users/1', tokens.manager)

            expect(response.status).toBe(200);
            // expect(response.data).toEqual({});
            expect(response.data.password).toBe('********');
        });

    });
    
});
