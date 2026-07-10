// prisma.config.ts
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  
  datasource: {
    url: 'postgresql://postgres:123456@localhost:5432/ttcs?schema=public',
  },
});