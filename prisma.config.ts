import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: "mongodb+srv://Vercel-Admin-HiManga_User_Stash:yBIo0Skidf60fZHx@himanga-user-stash.cc2xjux.mongodb.net/himanga?retryWrites=true&w=majority",
  },
});
