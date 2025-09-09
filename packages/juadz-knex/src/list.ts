import { QueryListParam, QueryFilter, QueryListFunction } from "@juadz/core";

import { Knex } from "knex";
// import dayjs from "dayjs";
import Debug from "debug";

const debug = Debug("juadz:knex:list");

interface TotalRow {
    T: number;
}

export interface KnexQueryBuilder {
    clone: () => Knex;
}

export function KnexQueryList<T>(
    knex: Knex,
    tableName: string,
    searchableFields: string[],
    filterableFields: string[],
    sortableFields: string[],
): QueryListFunction<T> {
    return async (params: QueryListParam) => {
        const query = knex(tableName);

        if (params.filter.length > 0) {
            debug("Applying filters:", params.filter);
            query.where((query: Knex) => {
                params.filter.forEach((f: QueryFilter) => {
                    const { field, op, value } = f;
                    if (field === "_search" && op === "=") {
                        query.andWhere((query: Knex) => {
                            (searchableFields || []).forEach((k) => {
                                query.orWhere(
                                    k as string,
                                    "LIKE",
                                    `%${`${value}`.replace(/(["'$%]+)/g, "")}%`,
                                );
                            });
                        });
                        return;
                    }

                    if (!filterableFields.includes(field)) {
                        debug(`Field "${field}" is not filterable`);
                        return;
                    }

                    let values: Array<string | number> = [];
                    if (Array.isArray(value)) {
                        values = value as Array<string | number>;
                    }

                    switch (op) {
                        case "=":
                            query.where(field, value);
                            return;
                        case "!=":
                            query.whereNot(field, value);
                            return;
                        case ">":
                        case ">=":
                        case "<":
                        case "<=":
                            query.where(field, op, value);
                            return;
                        case "in":
                            query.whereIn(field, values);
                            return;
                        case "!in":
                            query.whereNotIn(field, values);
                            return;
                        case "contains":
                            query.whereILike(field, `%${value}%`);
                            return;
                        case "!contains":
                            query.whereRaw(`\`${field}\` NOT LIKE ?`, [
                                `%${value}%`,
                            ]);
                            return;
                        case "between":
                            query.whereBetween(field, [values[0], values[1]]);
                            //if (query.client.config.client === "sqlite3") {
                            //    query.whereBetween(field, [
                            //        dayjs(values[0]).format(
                            //            "YYYY-MM-DD HH:mm:ss",
                            //        ),
                            //        dayjs(values[1]).format(
                            //            "YYYY-MM-DD HH:mm:ss",
                            //        ),
                            //    ]);
                            //} else {
                            //    query.whereBetween(field, [
                            //        values[0],
                            //        values[1],
                            //    ]);
                            //}

                            return;
                        case "!between":
                            query.whereNotBetween(field, [
                                values[0],
                                values[1],
                            ]);
                            return;
                        case "null":
                            query.whereNull(field);
                            return;
                        case "!null":
                            query.whereNotNull(field);
                            return;
                    }
                });
            });
        } else {
            debug("No filters applied");
        }

        let sql = null;

        const sorter = params.sort
            .filter((s) => {
                const pass = sortableFields.includes(s.field);
                if (!pass) {
                    debug(`Field "${s.field}" is not sortable`);
                }
                return pass;
            })
            .map((s) => ({
                column: s.field,
                order: s.direction,
            }));

        if (process.env.NODE_ENV !== "production") {
            sql = query
                .clone()
                .offset(params.range.offset)
                .limit(params.range.limit)
                .orderBy(sorter)
                .toString();
            debug("SQL Query:", sql);
        }

        const data = await query
            .clone()
            .offset(params.range.offset)
            .limit(params.range.limit)
            .orderBy(sorter);

        debug("Data fetched:", data.length, "rows");

        const totalRow: Array<TotalRow> = await query
            .clone()
            .clearSelect()
            .count("* AS T");
        const total = totalRow && totalRow.length ? totalRow[0].T : 0;
        debug("Total rows:", total);

        return {
            total,
            data,
            ...(sql ? { sql } : {}),
        };
    };
}
