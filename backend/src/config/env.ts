import 'dotenv/config';

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  DATABASE_URL: process.env.DATABASE_URL || '',

  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './data/dev.sqlite',
};
