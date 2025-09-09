export type TypeID = string | number;
// export type WithID = {id: TypeID};

export interface IDataRecord {
    id: TypeID;
    [key: string]: unknown;
}
