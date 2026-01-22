import { neon } from "@neondatabase/serverless";

// Create a reusable SQL client using Neon serverless
const sql = neon(process.env.DATABASE_URL!);

export { sql };
