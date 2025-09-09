import { SchemaFlags } from "@juadz/core";

export interface MongoSchemaFlags extends SchemaFlags {
    $mongoId?: boolean;
}

declare module "zod" {
    interface GlobalMeta extends SchemaFlags {
        $mongoId?: boolean;
    }
}
