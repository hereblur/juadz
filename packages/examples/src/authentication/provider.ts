import { IAuthProvider } from "@juadz/core";
import { UserActor } from "../types";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "default-$ecret";
const serverApiKey = process.env.API_KEY || "default-api-key";

interface JWTPayload {
    id: number;
    username: string;
    roles: string[];
}

const ROLES_MAP: Record<string, string[]> = {
    staff: [
        "view.users",
        "view.products",
        "view.customers",
        "update.products",
        "update.customers",
        "create.customers",
    ],
    supervisor: [
        "view.users",
        "view.products",
        "view.customers",
        "update.users",
        "update.products",
        "update.customers",
        "create.users",
        "create.products",
        "create.customers",
    ],
    manager: [
        "view.users",
        "view.products",
        "view.customers",
        "update.users",
        "update.products",
        "update.customers",
        "create.users",
        "create.products",
        "create.customers",
        "shop.manager",
    ],
};

export function createJwtToken(user: JWTPayload): string {
    return jwt.sign(user, jwtSecret, { expiresIn: "1h" });
}

export default {
    userJwt: {
        type: "http",
        scheme: "bearer",
        func: async (headers /*, query, params, body, request*/) => {
            const token = headers?.authorization?.split(" ")[1];
            if (!token) {
                return null;
            }

            try {
                const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
                if (
                    !decoded ||
                    typeof decoded !== "object" ||
                    !("id" in decoded) ||
                    !("username" in decoded)
                ) {
                    return null;
                }

                const permissions = (decoded as JWTPayload).roles
                    .flatMap((role) => ROLES_MAP[role] || [])
                    .filter(
                        (value, index, self) => self.indexOf(value) === index,
                    ); // Remove duplicates

                // Return the UserActor object with permissions
                return {
                    id: (decoded as JWTPayload).id,
                    username: (decoded as JWTPayload).username,
                    permissions,
                } as UserActor;
            } catch (error) {
                console.error("JWT verification failed:", error);
                return null;
            }
        },
    },
    apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        func: async (headers /*, query, params, body, request*/) => {
            const apiKey = headers?.["x-api-key"];
            if (!apiKey || apiKey !== serverApiKey) {
                return null;
            }

            return {
                id: "api",
                username: "api",
                permissions: ROLES_MAP["admin"],
            } as UserActor;
        },
    },
} as IAuthProvider;
