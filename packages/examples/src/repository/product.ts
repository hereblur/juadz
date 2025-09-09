import KnexProvider from "@juadz/knex";
import z, { output as Infer } from "zod";

import connection from "../db";

export const ProductSchema = z.object({
    id: z.int().meta({ $create: false, $update: false, $filter: true, $sort: true }),
    created_at: z.iso.datetime().meta({ $create: false, $update: false, $filter: true, $sort: true }),
    updated_at: z.iso.datetime().meta({ $create: false, $update: false, $filter: true, $sort: true }),

    category: z.string().max(255).meta({ $filter: true, $sort: true }),
    name: z.string().max(255).meta({ $search: true }),
    description: z.string().max(255).optional().meta({ $search: true }),

    price: z.number().positive().meta({ $update: "shop.manager", $sort: true, $filter: true }),
    stock: z.number().int().nonnegative().meta({ $update: "shop.manager", $sort: true, $filter: true }),
    sku: z.string().max(255).optional().meta({ $update: "shop.manager", $filter: true, $search: true }),
    image: z.string().max(255).optional(),
});


export default KnexProvider("products", ProductSchema, connection);
