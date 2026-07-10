import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;


const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const PrismaClientSingleton = () => {
  return new PrismaClient({
    adapter, 
    log: ['query', 'info', 'warn', 'error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof PrismaClientSingleton>;
}

const prisma = globalThis.prisma ?? PrismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}