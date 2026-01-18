import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
    private client: ReturnType<typeof postgres>;
    public db: PostgresJsDatabase<typeof schema>;

    constructor() {
        this.client = postgres(process.env.DATABASE_URL!);
        this.db = drizzle(this.client, { schema });
    }

    async onModuleDestroy() {
        await this.client.end();
    }

    // Helper to get the database instance
    getDb() {
        return this.db;
    }
}
