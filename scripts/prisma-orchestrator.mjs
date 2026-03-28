import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendRoot = resolve(__dirname, "..");

const services = [
  {
    name: "user-service",
    cwd: resolve(backendRoot, "services/user-service"),
    migrationOwner: false,
  },
  {
    name: "auth-service",
    cwd: resolve(backendRoot, "services/auth-service"),
    migrationOwner: true,
  },
];

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function prismaGenerateAll() {
  for (const service of services) {
    console.log(`\n[prisma:generate] ${service.name}`);
    run("npx", ["prisma", "generate"], service.cwd);
  }
}

function getMigrationName(args) {
  const nameArg = args.find((arg) => arg.startsWith("--name="));
  if (nameArg) return nameArg.slice("--name=".length);

  const nameFlagIndex = args.findIndex((arg) => arg === "--name");
  if (nameFlagIndex >= 0 && args[nameFlagIndex + 1]) {
    return args[nameFlagIndex + 1];
  }

  return undefined;
}

function prismaMigrateDev(args) {
  const migrationName = getMigrationName(args);
  if (!migrationName) {
    console.error(
      "Missing migration name. Example: npm run prisma:migrate:dev -- --name add_users_table",
    );
    process.exit(1);
  }

  // Shared DB should have a single migration owner to avoid migration history conflicts.
  const owner = services.find((service) => service.migrationOwner);
  if (!owner) {
    console.error("Migration owner service is not configured.");
    process.exit(1);
  }

  const migrationsDir = resolve(owner.cwd, "prisma/migrations");
  if (!existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  console.log(`\n[prisma:migrate:dev] ${owner.name} --name ${migrationName}`);
  run("npx", ["prisma", "migrate", "dev", "--name", migrationName], owner.cwd);

  console.log("\nSyncing Prisma Client in all services...");
  prismaGenerateAll();
}

const action = process.argv[2];
const actionArgs = process.argv.slice(3);

if (action === "generate") {
  prismaGenerateAll();
  process.exit(0);
}

if (action === "migrate-dev") {
  prismaMigrateDev(actionArgs);
  process.exit(0);
}

console.error("Unknown action. Use one of: generate, migrate-dev");
process.exit(1);
