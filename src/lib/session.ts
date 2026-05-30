import { prisma } from './db';
import { getServerSession } from "next-auth";
// If you use next-auth, import your options here. 
// For now, I'll assume a standard session fetch or the logic from actions.ts

export async function getCurrentUser() {
  const session = await getServerSession() as any;
  if (!session?.user?.email) {
    throw new Error("غير مصرح لك بالوصول");
  }

  const user = await (prisma as any).user.findUnique({
    where: { username: session.user.email }, // assuming email is stored in username or similar
    include: { agency: true }
  });

  if (!user) {
    throw new Error("المستخدم غير موجود");
  }

  return user;
}
