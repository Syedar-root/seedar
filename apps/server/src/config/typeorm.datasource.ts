import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, 'utf8');
  const parsed: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function loadEnvFiles(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envDir = process.cwd();
  const envFiles = [
    join(envDir, `.env.${nodeEnv}`),
    join(envDir, '.env.local'),
    join(envDir, '.env'),
  ];

  for (const filePath of envFiles) {
    if (!existsSync(filePath)) continue;
    const fileVars = parseEnvFile(filePath);
    for (const [key, value] of Object.entries(fileVars)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

loadEnvFiles();

const isDev = process.env.NODE_ENV === 'development';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: toInt(process.env.DB_PORT, 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'seedar_db',
  charset: 'utf8mb4',
  timezone: 'Z',
  synchronize: false,
  logging: isDev ? ['error', 'warn', 'log', 'info', 'schema', 'migration'] : ['error', 'warn'],
  entities: [join(__dirname, '../module/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
});
