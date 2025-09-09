import bcrypt from "bcrypt";
import { Knex } from "knex";
import { faker } from "@faker-js/faker";
const password = bcrypt.hashSync("12345678", 8);

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries

    if (process.env.NODE_ENV === "test") {
        await knex("users").del();
        await knex("categories").del();
        await knex("products").del();
        await knex("customers").del();
    } else {
        const count = await knex("users").count("id as c").first();
        if (count?.c) {
            return; // Skip seeding if users already exist
        }
    }

    // Inserts seed entries
    await knex("users").insert([
        {
            username: "johndoe",
            email: "john@email.com",
            password,
            roles: "manager",
        },
        {
            username: "janedoe",
            email: "jane@email.com",
            password,
            roles: "supervisor",
        },
        {
            username: "jamesdoe",
            password,
            roles: "staff",
            email: "james@email.com"
        }
    ]);

    await knex("categories").insert([
        {
            id: "dogfood",
            name: "Dog food",
            description: "High quality dog food",
            image: "https://example.com/dogfood.jpg",
        },
        {
            id: "catfood",
            name: "Cat food",
            description: "Premium cat food",
            image: "https://example.com/catfood.jpg",
        },
        {
            id: "toy",
            name: "Toys",
            description: "Fun toys for pets",
            image: "https://example.com/toys.jpg",
        },
    ]);

    const products = Array.from({ length: 50 }, () => ({
        category: faker.helpers.arrayElement(["dogfood", "catfood", "toy"]),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 0, max: 100 }),
        sku: faker.string.alphanumeric(10),
        image: faker.image.urlLoremFlickr({ category: "animals" }),
    }));

    await knex("products").insert(products);

    const customers = Array.from({ length: 20 }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        tel: faker.phone.number(),
        address: faker.location.streetAddress(),
        note: faker.lorem.sentence(),
        credits: parseFloat(
            faker.commerce.price({
                min: 0,
                max: 1000,
                dec: 2,
                symbol: "",
            }),
        ),
    }));

    await knex("customers").insert(customers);
}
