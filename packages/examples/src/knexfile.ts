import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
    test: {
        client: "sqlite3",
        connection: {
            filename: ":memory:",
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations/`,
            tableName: "__migrations__",
        },
        seeds: {
            directory: `${__dirname}/migrations/seeds/testing`,
        },
        useNullAsDefault: true,
    },
    development: {
        client: "sqlite3",
        connection: {
            filename: "./dev.sqlite3",
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations/`,
            tableName: "__migrations__",
        },
        seeds: {
            directory: `${__dirname}/migrations/seeds/development`,
        },
        useNullAsDefault: true,
    },
    production: {
        client: "mysql",
        connection: {
            host: process.env.DB_HOST || "localhost",
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/migrations`,
            tableName: "knex_migrations",
        },
        seeds: {},
    },
};

export default config;
