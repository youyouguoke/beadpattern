import { downloadPatternPng, downloadPatternPdf, recordAnalytics } from "@/lib/publicApiService";

export async function downloadPng(slug: string, scale = 1) {
  const result = await downloadPatternPng(slug, scale);
  await recordAnalytics(slug, "download");
  const a = document.createElement("a");
  a.href = result.url;
  a.download = result.filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
}

export async function downloadPdf(slug: string, scale = 1) {
  const result = await downloadPatternPdf(slug, scale);
  await recordAnalytics(slug, "download");
  window.open(result.url, "_blank");
}
