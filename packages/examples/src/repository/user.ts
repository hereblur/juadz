import KnexProvider from "@juadz/knex";
import {
    ErrorToHttp,
    IDataRepositoryProvider,
} from "@juadz/core";
import z, { output as Infer } from "zod";

import bcrypt from "bcrypt";

import { UserActor } from "../types";
import connection from "../db";
import { createJwtToken } from "../authentication/provider";

export const UserSchema = z.object({
    id: z.int().meta({ $update: false, $create: false, $sort: true, $filter: true }),

    updated_at: z.iso.datetime().meta({ $create: false, $update: false, $sort: true, $filter: true }),
    created_at: z.iso.datetime().meta({ $create: false, $update: false, $sort: true, $filter: true }),

    username: z.string().meta({ $search: true  }),
    password: z.string().meta({ $view: () => "********" }),

    email: z.email().optional(),
    nickname: z.string().optional(),
    tel: z.string().optional(),

    status: z.enum(["ACTIVE", "SUSPENDED"]).meta({ $sort: true, $filter: true }),
    roles: z.string().meta({ $sort: true, $filter: true, $view: 'shop.manager' }),
});

export type TUser = Infer<typeof UserSchema>;

const { schema, name, create, update, list, get } = KnexProvider("users", UserSchema, connection);

export async function login(username: string, password: string) {
    const user = (await connection("users")
        .where({ username })
        .first()) as TUser;

    if (
        !user ||
        user.status !== "ACTIVE" ||
        !bcrypt.compareSync(password, user.password)
    ) {
        //console.log(bcrypt.compareSync(password, user.password))
        throw new ErrorToHttp("Login failed", 401, true);
    }

    const jwtToken = createJwtToken({
        id: user.id,
        username: user.username,
        roles: user.roles.split(","),
    });

    return {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        jwt: jwtToken,
    };
}

export async function me(actor: UserActor) {
    // console.log(actor)
    return await get!(actor.id);
}

export default { schema, name, create, update, list, get } as IDataRepositoryProvider<TUser>;
