import { KnexQueryList } from "./list";
import { QueryListResults } from "@juadz/core";
import Knex, { Knex as KnexType } from "knex";

let knex: KnexType;

beforeAll(async () => {
    knex = Knex({
        client: "sqlite3",
        connection: {
            filename: ":memory:",
        },
        useNullAsDefault: true,
    }) as KnexType;

    await knex.schema.createTable(
        "users",
        (table: KnexType.CreateTableBuilder) => {
            table.increments();
            table.string("name");
            table.string("last_name");
            table.integer("age");
            table.string("tool");
        },
    );

    await knex("users").insert([
        { name: "Peter", last_name: "Parker", age: 11, tool: "ruler" },
        { name: "Mark", last_name: "Olivier", age: 18, tool: "pencil" },
        { name: "Andre", last_name: "Hudson", age: 18, tool: "pen" },
        { name: "Tony", last_name: "Oliver", age: 18, tool: "pen" },
        { name: "Bruce", last_name: "Pedersen", age: 13, tool: "crayon" },
    ]);
});

afterAll(() => {
    // The test uses an in-memory SQLite database (:memory:), so /tmp/test.sqlite is never created. Remove or update this cleanup to match the actual test database.
    // unlink('/tmp/test.sqlite', () => {});
});

test("KnexQueryList", async () => {
    const func = KnexQueryList(
        knex,
        "users",
        ["name", "last_name"],
        ["age", "tool"],
        ["age"],
    );

    const result: QueryListResults<unknown> = await func({
        resource: "users",
        range: { offset: 0, limit: 10 },
        sort: [{ field: "age", direction: "ASC" }],
        filter: [
            { field: "_search", op: "=", value: "Pe" },
            { field: "age", op: "between", value: [8, 17] },
            { field: "tool", op: "!in", value: ["pencil", "pen"] },
        ],
    });
    const r = result as unknown;
    const { sql: debug } = r as DebugObj;

    expect(debug).toBe(
        "select * from `users` where ((`name` like '%Pe%' or `last_name` like '%Pe%') and `age` between 8 and 17 and `tool` not in ('pencil', 'pen')) order by `age` ASC limit 10",
    );

    expect(result.total).toBe(2);
    expect(result.data[0]).toMatchObject({
        name: "Peter",
        last_name: "Parker",
        age: 11,
        tool: "ruler",
    });
    expect(result.data[1]).toMatchObject({
        name: "Bruce",
        last_name: "Pedersen",
        age: 13,
        tool: "crayon",
    });

    expect(debug).toBe(
        "select * from `users` where ((`name` like '%Pe%' or `last_name` like '%Pe%') and `age` between 8 and 17 and `tool` not in ('pencil', 'pen')) order by `age` ASC limit 10",
    );
});

interface DebugObj {
    sql: string;
}
