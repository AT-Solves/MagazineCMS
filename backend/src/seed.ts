import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'magazineos',
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();

  // Create demo organization
  const orgResult = await AppDataSource.query(`
    INSERT INTO organizations (name, slug, tier, metadata)
    VALUES ('Demo Magazine', 'demo-magazine', 'pro', '{}')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `);
  const orgId = orgResult[0].id;
  console.log('Organization ID:', orgId);

  // Create admin user: admin@demo.com / admin123
  const hash = await bcrypt.hash('admin123', 10);
  await AppDataSource.query(`
    INSERT INTO users (email, password_hash, full_name, role, org_id, child_safety_clearance, is_active)
    VALUES ('admin@demo.com', $1, 'Admin User', 'admin', $2, true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `, [hash, orgId]);

  // Create editor user: editor@demo.com / editor123
  const editorHash = await bcrypt.hash('editor123', 10);
  await AppDataSource.query(`
    INSERT INTO users (email, password_hash, full_name, role, org_id, child_safety_clearance, is_active)
    VALUES ('editor@demo.com', $1, 'Editor User', 'editor', $2, true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `, [editorHash, orgId]);

  console.log('Seeded: admin@demo.com / admin123');
  console.log('Seeded: editor@demo.com / editor123');
  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
