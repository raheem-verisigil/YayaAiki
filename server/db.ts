import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, type InsertUser } from "../drizzle/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db && process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    db = drizzle(pool);
  }
  return db;
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
  db = null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const database = getDb();
  if (!database) throw new Error("DATABASE_URL is not configured");

  const values: InsertUser = { ...user, lastSignedIn: user.lastSignedIn ?? new Date() };
  await database.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: values.name,
      email: values.email,
      loginMethod: values.loginMethod,
      lastSignedIn: values.lastSignedIn,
      updatedAt: new Date(),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const database = getDb();
  if (!database) return undefined;
  const result = await database.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
