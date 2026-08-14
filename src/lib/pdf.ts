// PDF generation via a real headless Chromium instance rendering plain HTML/CSS - this
// guarantees correct Arabic (RTL, letter shaping) and German text rendering for free, since
// it's the same rendering engine already used to correctly display both languages across the
// storefront. No PDF library's own text-shaping code to get wrong for a legal document.
//
// Two Chromium sources depending on environment: on Vercel, `puppeteer` (which bundles a full
// Chromium download) is too large for the serverless function size limit, so production uses
// `puppeteer-core` with `@sparticuz/chromium`'s slim, Lambda/Vercel-compatible binary instead.
// Locally (including this Windows dev machine), the full `puppeteer` package's own bundled
// Chromium is used, since `@sparticuz/chromium` only ships a Linux binary.
import type { Browser } from "puppeteer-core";

async function getBrowser(): Promise<Browser> {
  // AWS_LAMBDA_FUNCTION_NAME is injected only by the actual serverless runtime at invocation
  // time - unlike VERCEL/VERCEL_ENV, it's never present in a `vercel env pull`-generated .env
  // file, so it reliably distinguishes "really running on Vercel" from "running locally with
  // Vercel's project env vars loaded" (this project's .env is the latter).
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Promise<Browser>;
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({ headless: true }) as unknown as Promise<Browser>;
}

// Renders a self-contained HTML string (inline CSS - no external stylesheet/font requests,
// since the sandboxed Chromium instance has no reason to reach the network) to a PDF buffer.
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
