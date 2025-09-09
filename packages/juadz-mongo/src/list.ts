import {
    QueryListParam,
    QueryFilter,
    QueryListFunction,
    QuerySort,
} from "@juadz/core";
import { Collection, ObjectId, SortDirection } from "mongodb";

export interface MongoQueryListOptions {
    searchable?: Array<string>;
    filterable?: Array<string>;
    sortable?: Array<string>;
    mongoIds?: Array<string>; // Use MongoDB ObjectId

    ignoreFields?: Array<string>; // Ignore fields
    debug?: boolean; // Return debug information
}

function mongoValue(v: unknown, isObjectId: boolean): unknown {
    if (!isObjectId) {
        return v;
    }
    if (Array.isArray(v)) {
        return v.map((_v: unknown) => mongoValue(_v, isObjectId));
    }
    if (isObjectId) {
        return new ObjectId(`${v}`);
    }

    return v;
}

export function MongoQueryListBuildConditions(
    params: QueryListParam,
    options: MongoQueryListOptions,
) {
    const conditions: Record<string, unknown> = {};

    params.filter.forEach((f: QueryFilter) => {
        const { field: field_, op, value: value_ } = f;
        // console.log(JSON.stringify(f))

        if (options.ignoreFields && options.ignoreFields.indexOf(field_) >= 0) {
            return;
        }

        const isObjectId =
            options.mongoIds && options.mongoIds.indexOf(field_) >= 0;

        const field = field_ == "id" ? "_id" : field_;

        // Free text search
        if (field === "_search" && op === "=") {
            (options.searchable || []).forEach((k) => {
                conditions[k] = { $regex: `${value_}`, $options: "i" };
            });
            return;
        }

        const addCondition = (field: string, condition: object) => {
            if (conditions[field]) {
                conditions[field] = {
                    ...condition,
                    ...(conditions[field] as object),
                };
            } else {
                conditions[field] = { ...condition };
            }
        };

        switch (op) {
            case "=":
                addCondition(field, { $eq: mongoValue(value_, isObjectId) });
                return;
            case "!=":
                addCondition(field, { $ne: mongoValue(value_, isObjectId) });
                return;
            case ">":
                addCondition(field, { $gt: mongoValue(value_, isObjectId) });
                return;
            case ">=":
                addCondition(field, { $gte: mongoValue(value_, isObjectId) });
                return;
            case "<":
                addCondition(field, { $lt: mongoValue(value_, isObjectId) });
                return;
            case "<=":
                addCondition(field, { $lte: mongoValue(value_, isObjectId) });
                return;
            case "in":
                addCondition(field, { $in: mongoValue(value_, isObjectId) });
                return;
            case "!in":
                addCondition(field, { $nin: mongoValue(value_, isObjectId) });
                return;
            case "contains":
                addCondition(field, { $regex: `${value_}`, $options: "i" });
                return;
            case "!contains":
                addCondition(field, {
                    $not: { $regex: `${value_}`, $options: "i" },
                });
                return;
            case "between":
                {
                    const values = mongoValue(value_, isObjectId);
                    addCondition(field, { $gte: values[0], $lte: values[1] });
                }
                return;
            case "!between":
                {
                    const values = mongoValue(value_, isObjectId);
                    addCondition(field, {
                        $not: { $gte: values[0], $lte: values[1] },
                    });
                }
                return;
            case "null":
                addCondition(field, { $eq: null });
                return;
            case "!null":
                addCondition(field, { $ne: null });
                return;
        }
    });

    return conditions;
}

export function MongoQueryList<T>(
    options: MongoQueryListOptions,
    collection: Collection<T>,
): QueryListFunction<T> {
    const func: QueryListFunction<T> = async (params: QueryListParam) => {
        const query = collection as Collection<T>;

        const conditions = MongoQueryListBuildConditions(params, options);

        const data = await query
            .find(conditions)
            .skip(params.range.offset)
            .limit(params.range.limit)
            .sort(convertToSort(params.sort))
            .toArray();
        const dataWithId = data.map(
            (a) =>
                ({
                    id: a._id.toString(),
                    ...a,
                }) as T,
        );

        const total = await query.countDocuments(conditions);

        return {
            total,
            data: dataWithId,
        };
    };

    return func;
}

type SortType = { [key: string]: SortDirection };

export function convertToSort(querySort: QuerySort[]): SortType {
    const sort: SortType = {};
    querySort.forEach((curr: QuerySort) => {
        sort[curr.field] = curr.direction?.toUpperCase() === "ASC" ? 1 : -1;
    });

    return sort;
}
