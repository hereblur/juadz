import { Resource } from "@juadz/core";
import DataProvider, {
    login,
    me,
    TUser
} from "../repository/user";
import bcrypt from "bcrypt";
import z from "zod";
import { UserActor } from "../types";

export const UserResource = new Resource<TUser>(DataProvider);
UserResource.authentication = ["userJwt", "apiKey"];

UserResource.addHook("preCreate", encryptPassword);
UserResource.addHook("preUpdate", encryptPassword);

async function encryptPassword(record: TUser) {
    if (record.password) {
        record.password = bcrypt.hashSync(record.password, 12);
    }
    return record;
}

const LoginBodySchema = z.object({
    username: z
        .string()
        .min(1)
        .meta({ examples: ["johndoe"] }),
    password: z
        .string()
        .min(8)
        .meta({ examples: ["12345678"] }),
});

UserResource.addRoute({
    method: "POST",
    path: `me/login`,
    authentication: [],
    tags: ["authen"],
    bodySchema: LoginBodySchema,
    responseSchema: z.object({
        id: z.number(),
        username: z.string(),
        nickname: z.string(),
        jwt: z.string(),
    }),

    handler: async (req) => {
        const { username, password } = req.body as z.output<
            typeof LoginBodySchema
        >;

        const { id, nickname, jwt } = await login(username, password);

        return {
            statusCode: 200,
            body: {
                id,
                username,
                nickname,
                jwt,
            },
        };
    },
});

UserResource.addRoute({
    method: "GET",
    path: `me`,
    authentication: ["userJwt"],
    tags: ["authen"],
    responseSchema: UserResource.viewSchema,
    handler: async (req) => {
        return {
            statusCode: 200,
            body: {
                ...(await UserResource.viewAs(
                    await me(req.actor as UserActor),
                    req.actor,
                )),
            },
        };
    },
});
