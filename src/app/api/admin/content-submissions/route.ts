import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const submissions = await prisma.contentSubmission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }], // Postgres enums sort by declaration order: PENDING, APPROVED, REJECTED
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      profileUrl: s.profileUrl,
      videoUrl: s.videoUrl,
      createdAt: s.createdAt,
      reviewedAt: s.reviewedAt,
      user: s.user,
    })),
  });
}
