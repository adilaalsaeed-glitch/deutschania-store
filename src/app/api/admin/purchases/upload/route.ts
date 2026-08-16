import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB - supplier invoice scans/photos run larger than product images
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || !ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const pathname = `purchases/${crypto.randomUUID()}.${ext}`;

  const blob = await put(pathname, file, { access: "public", contentType: file.type });

  return NextResponse.json({ url: blob.url });
}
