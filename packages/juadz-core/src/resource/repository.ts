import { IDataRecord, TypeID } from "../types/common";
import {
    IDataRepositoryProvider,
    QueryListParam,
    QueryListResults,
} from "../types/crud";

export class DataRepository<T extends IDataRecord = IDataRecord> {
    private _database: IDataRepositoryProvider<T> | null = null;

    set database(db: IDataRepositoryProvider<T> | null) {
        this._database = db;
    }
    get database(): IDataRepositoryProvider<T> | null {
        return this._database;
    }

    get(id: TypeID): Promise<T | null> {
        if (!this._database || !this._database.get) {
            throw new Error(
                "Database provider not set or does not support 'get' operation",
            );
        }

        return this._database.get(id);
    }

    create(data: T): Promise<T> {
        if (!this._database || !this._database.create) {
            throw new Error(
                "Database provider not set or does not support 'create' operation",
            );
        }
        return this._database.create(data);
    }

    update(id: TypeID, patch: Partial<T>): Promise<T> {
        if (!this._database || !this._database.update) {
            throw new Error(
                "Database provider not set or does not support 'update' operation",
            );
        }
        return this._database.update(id, patch);
    }

    replace(id: TypeID, data: T): Promise<T> {
        if (!this._database || !this._database.replace) {
            throw new Error(
                "Database provider not set or does not support 'replace' operation",
            );
        }
        return this._database.replace(id, data);
    }

    list(query: QueryListParam): Promise<QueryListResults<T>> {
        if (!this._database || !this._database.list) {
            throw new Error(
                "Database provider not set or does not support 'list' operation",
            );
        }
        return this._database.list(query);
    }

    delete(id: TypeID): Promise<number> {
        if (!this._database || !this._database.delete) {
            throw new Error(
                "Database provider not set or does not support 'delete' operation",
            );
        }
        return this._database.delete(id);
    }

    setDatabase(database: IDataRepositoryProvider<T>) {
        this._database = database;
    }

    has(method: keyof IDataRepositoryProvider<T>): boolean {
        return this._database &&
            this._database[method] &&
            typeof this._database[method] === "function"
            ? true
            : false;
    }
}
