import KnexProvider from "@juadz/knex";
import z, { output as Infer } from "zod";

import connection from "../db";

export const CategorySchema = z.object({
    id: z.string().meta({ $filter: true, $sort: true, $create: false, $update: false }),
    name: z.string().meta({ $search: true }),
    description: z.string().meta({ examples: ["This is a category for electronics."] }),
    image: z.string().optional().meta({ summary: 'Image URL for the category', description: 'Make sure you have right to use it.' }),
}).meta({
    description: "Category Schema[fix set]",
    // description: "You cannot create or update category.",
});

export default KnexProvider("categories", CategorySchema, connection);
