import { Knex } from "knex";
import { seed as testingSeed } from "../testing";

export async function seed(knex: Knex): Promise<void> {
    await testingSeed(knex);
}
