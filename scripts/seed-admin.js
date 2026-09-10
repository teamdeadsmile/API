import 'dotenv/config';
import { hashPassword } from '../src/utils/password.js';
import { upsertAdminUser } from '../src/repositories/users.repository.js';
import { pool } from '../src/config/database.js';

async function main() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || 'admin';

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set as env vars (never committed to disk).');
    process.exitCode = 1;
    return;
  }

  if (password.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await upsertAdminUser({ username, email, passwordHash });
}

main()
  .catch((err) => {
    console.error('Failed to seed admin:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
