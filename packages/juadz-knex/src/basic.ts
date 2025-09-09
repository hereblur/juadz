import { flagPaths, IDataRecord, IDataRepositoryProvider } from "@juadz/core";
import { Knex } from "knex";
import { KnexQueryList } from "./list";
import { output, ZodObject, ZodRawShape } from "zod";

export function KnexProvider<
    Shape extends ZodRawShape,
    Schema extends ZodObject<Shape>,
    T extends IDataRecord = output<Schema> & IDataRecord,
>(
    dataTableName: string,
    schema: Schema,
    connection: Knex,
): IDataRepositoryProvider<T> {
    // schema.name = schema.name || dataTableName;
    const flags = flagPaths(schema);

    const searchableFields = flags.$search || [];
    const filterableFields = flags.$filter || [];
    const sortableFields = flags.$sort || [];

    const get = async (id: string | number) => {
        const c = await connection(dataTableName)
            .select("*")
            .where("id", id)
            .first();

        return c;
    };

    const update = async (id: string | number, patch: object) => {
        await connection(dataTableName).where("id", id).update(patch);

        return await get(id);
    };

    const create = async (params_: object) => {
        const params = {
            ...params_,
        } as Record<string, unknown>;

        let insertedId: unknown;

        if (connection.client.config.client === "sqlite3") {
            // SQLite does not support `.returning('id')`
            const inserted = await connection(dataTableName)
                .returning("id")
                .insert({
                    ...params,
                });

            insertedId = (inserted[0] as unknown as { id: string | number }).id;
        } else {
            // For other SQL clients that support `.returning('id')`
            const inserted = await connection(dataTableName)
                .returning("id")
                .insert({
                    ...params,
                });

            insertedId = inserted[0];
        }

        const insertedData = await get(insertedId as string | number);
        return insertedData;
    };

    const replace = async (id: string | number, params_: object) => {
        const params = {
            id,
            ...params_,
        } as Record<string, unknown>;

        const fields: Array<string> = [];
        const values: Array<unknown> = [];
        Object.keys(params).forEach((f) => {
            fields.push(`\`${f}\`=?`);
            values.push(params[f]);
        });

        await connection.raw(
            `REPLACE INTO \`${dataTableName}\` SET ${fields.join(", ")} WHERE id=?`,
            [
                ...values,
                id, // Ensure the ID is at the end for the WHERE clause
            ] as Array<string | number | Date | boolean | null>,
        );

        const insertedData = await get(id);

        return insertedData;
    };

    const delete_ = async (id: string | number) => {
        const result = await connection(dataTableName).where("id", id).delete();

        return result;
    };

    const list = KnexQueryList(
        connection,
        dataTableName,
        searchableFields,
        filterableFields,
        sortableFields,
    );

    return {
        schema,
        name: dataTableName,

        get,
        replace,
        update,
        create,
        delete: delete_,
        list,
    } as IDataRepositoryProvider<T>;
}
