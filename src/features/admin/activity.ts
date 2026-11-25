import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

type Db = Pick<ReturnType<typeof getPrisma>, "adminActivityLog"> | Prisma.TransactionClient;

/** Audit trail for admin changes. Pass a transaction client to log atomically with the change. */
export async function logActivity(
  entry: { userId: string; action: string; entityType: string; entityId?: string; metadata?: Prisma.InputJsonValue; ipAddress?: string | null },
  db: Db = getPrisma(),
) {
  await db.adminActivityLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}
