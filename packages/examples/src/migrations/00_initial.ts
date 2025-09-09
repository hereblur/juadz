import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.timestamps(true, true);

        table.string("username").notNullable().unique();
        table.string("password").notNullable();
        table.string("nickname").defaultTo("");
        table.string("email").defaultTo("");
        table.string("tel").defaultTo("");
        table.enum("status", ["ACTIVE", "INACTIVE"]).defaultTo("ACTIVE");
        table.string("roles").defaultTo("");
    });

    await knex.schema.createTable("categories", (table) => {
        table.string("id").primary();
        table.timestamps(true, true);

        table.string("name").notNullable().unique();
        table.string("description").nullable();
        table.string("image").nullable();
    });

    await knex.schema.createTable("products", (table) => {
        table.increments("id").primary();
        table.timestamps(true, true);

        table.string("category").notNullable();
        table.string("name").notNullable();
        table.string("description").nullable();
        table.decimal("price", 10, 2).notNullable();
        table.integer("stock").unsigned().notNullable();
        table.string("sku").nullable();
        table.string("image").nullable();
    });

    await knex.schema.createTable("customers", (table) => {
        table.increments("id").primary();
        table.timestamps(true, true);

        table.string("name").notNullable();
        table.string("email").notNullable().unique();
        table.string("tel").nullable();
        table.string("address").nullable();
        table.string("note").nullable();
        table.decimal("credits", 14, 3).defaultTo(0);
    });
}

export async function down(/*knex: Knex*/): Promise<void> {}
