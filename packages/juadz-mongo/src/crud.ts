import { flagPaths, IDataRecord, IDataRepositoryProvider } from "@juadz/core";
import {
    Db,
    Filter,
    MatchKeysAndValues,
    ObjectId,
    OptionalUnlessRequiredId,
    WithoutId,
} from "mongodb";
import { output, ZodObject, ZodRawShape } from "zod";

import "./types";
import { MongoSchemaFlags } from "./types";
import { MongoQueryList } from "./list";

interface MongoDocument extends IDataRecord {
    _id: ObjectId;
}

export function MongoProvider<
    Shape extends ZodRawShape,
    Schema extends ZodObject<Shape>,
    T extends MongoDocument = output<Schema> & MongoDocument,
>(collectionName: string, schema: Schema, db: Db): IDataRepositoryProvider<T> {
    const collection = db.collection<T>(collectionName);
    const flags = flagPaths(schema) as Record<keyof MongoSchemaFlags, string[]>;

    const searchableFields = flags.$search || [];
    const filterableFields = flags.$filter || [];
    const sortableFields = flags.$sort || [];
    const mongoId = flags.$mongoId || [];

    const get = async (id: string | number) => {
        const result = await collection.findOne({
            _id: new ObjectId(id),
        } as Filter<T>);
        return result;
    };

    const update = async (id: string | number, patch: object) => {
        await collection.updateOne({ _id: new ObjectId(id) } as Filter<T>, {
            $set: patch as MatchKeysAndValues<T>,
        });
        return await get(id);
    };

    const create = async (params_: object) => {
        const params = {
            ...params_,
        } as OptionalUnlessRequiredId<T>;

        const result = await collection.insertOne(params);
        const insertedId = result.insertedId;
        return await get(insertedId.toString());
    };

    const replace = async (id: string | number, params_: object) => {
        const params = {
            // _id: id,
            ...params_,
        } as WithoutId<T>;

        await collection.replaceOne(
            { _id: new ObjectId(id) } as Filter<T>,
            params,
            { upsert: true },
        );
        return await get(id);
    };

    const delete_ = async (id: string | number) => {
        const result = await collection.deleteOne({
            _id: new ObjectId(id),
        } as Filter<T>);
        return result.deletedCount;
    };

    const list = MongoQueryList<T>(
        {
            searchable: searchableFields,
            filterable: filterableFields,
            sortable: sortableFields,
            mongoIds: mongoId,
        },
        collection,
    );

    return {
        schema,
        name: collectionName,

        get,
        replace,
        update,
        create,
        delete: delete_,
        list,
    } as IDataRepositoryProvider<T>;
}
