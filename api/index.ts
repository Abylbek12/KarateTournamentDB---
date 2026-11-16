// Vercel entry point: the whole Express API runs as one serverless function.
// Data is kept in Postgres (DATABASE_URL / POSTGRES_URL from the Vercel "Storage" tab).
import app from '../server';

export default app;
