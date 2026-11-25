// Point the app's Prisma client at the test database before any module loads it.
const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;
// Image storage stays off in integration tests unless explicitly configured.
for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT"]) delete process.env[k];
