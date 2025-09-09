import Knex, { Knex as KnexInstance } from "knex";
import config from "./knexfile";
import Debug from "debug";

const debug = Debug("juadz:example:db");

debug(`Connecting to database [env: ${process.env.NODE_ENV || 'development'}]...`);
const connection: KnexInstance = Knex(
    config[process.env.NODE_ENV || "development"],
);

export async function migrate() {
    await connection.migrate.latest();

    if (process.env.NODE_ENV !== "production") {
        await connection.seed.run();
    }
}

export async function closeDatabase() {
    await connection.destroy();
    debug("Database connection closed.");
}

export default connection;
