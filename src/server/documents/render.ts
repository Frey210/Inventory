import { chromium } from "playwright";
import QRCode from "qrcode";
import { loanHtml, escape } from "./template";
export async function renderLoanPdf(
  payload: unknown,
  version: number,
  baseUrl: string,
  photos: Record<string, string> = {},
) {
  const loan = payload as { id: string; number: string };
  const browser = await chromium.launch({
    headless: true,
    chromiumSandbox: process.env.CHROMIUM_SANDBOX !== "off",
  });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    const qr = await QRCode.toDataURL(`${baseUrl}/loans/${loan.id}`);
    await page.setContent(loanHtml(payload, version, qr, photos), {
      waitUntil: "load",
      timeout: 30000,
    });
    return await page.pdf({
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="font:8pt Arial;text-align:center;width:100%">${escape(loan.number)} · v${version} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
    });
  } finally {
    await browser.close();
  }
}
