import { user } from './schema';

// Export types for use in controllers and services
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
