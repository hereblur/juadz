import { IACLActor } from "@juadz/core";

export interface UserActor extends IACLActor {
    id: string | number;
    username: string;
}
