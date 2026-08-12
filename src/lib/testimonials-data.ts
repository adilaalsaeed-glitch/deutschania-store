import { prisma } from "@/lib/db";
import { detectPlatform, type TestimonialItem } from "@/lib/testimonials";

// Server-only (imports prisma) — call this from server components/route handlers, never from
// client components.
export async function getApprovedTestimonials(limit?: number): Promise<TestimonialItem[]> {
  const rows = await prisma.contentSubmission.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, videoUrl: true, thumbnailUrl: true, createdAt: true, user: { select: { firstName: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    videoUrl: r.videoUrl,
    thumbnailUrl: r.thumbnailUrl,
    platform: detectPlatform(r.videoUrl),
    firstName: r.user.firstName,
    createdAt: r.createdAt,
  }));
}
