declare module 'better-sqlite3' {
    class Database {
        constructor(filename: string, options?: { readonly?: boolean; fileMustExist?: boolean });

        prepare(sql: string): {
            run(...params: unknown[]): { changes: number; lastInsertRowid: number };
            get(...params: unknown[]): unknown;
            all(...params: unknown[]): unknown[];
            iterate(...params: unknown[]): IterableIterator<unknown>;
        };

        exec(sql: string): void;
        close(): void;
    }

    export = Database;
}
