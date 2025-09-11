// Make TypeScript accept generated Prisma path strings even if type files are missing
// This does NOT affect runtime resolution, only type-checking.

declare module "../../generated/prisma";
