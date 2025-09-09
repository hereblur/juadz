import KnexProvider from "@juadz/knex";
import z, { output as Infer } from "zod";

import connection from "../db";

export const CustomerSchema = z.object({
    id: z.int().meta({ $create: false, $update: false, $filter: true, $sort: true }),
    created_at: z.iso.datetime().meta({ $create: false, $update: false, $filter: true, $sort: true }),
    updated_at: z.iso.datetime().meta({ $create: false, $update: false, $filter: true, $sort: true }),

    name: z.string().max(255).meta({ $search: true }),
    tel: z.string().max(255).optional().meta({ $search: true }),
    email: z.email().optional().meta({ $search: true }),
    address: z.string().max(255).optional(),
    note: z.string().optional(),
    credits: z.number().int().meta({ $update: "shop.manager", $sort: true, description: "This is the amount of credits the customer has." }).default(0),
}).meta({
    description: "This schema defines the structure of a customer in the system.",
});

export default KnexProvider("customers", CustomerSchema, connection);
