// Vercel entry point: the whole Express API runs as one serverless function.
// `npm run build` bundles server.ts into api/_server.mjs (one file, so Node's
// ES module resolution has nothing to guess). Data is kept in Postgres
// (DATABASE_URL / POSTGRES_URL from the Vercel "Storage" tab).
// @ts-ignore -- generated at build time
import app from './_server.mjs';

export default app;
