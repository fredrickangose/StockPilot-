import { apiFetch } from "./client";
import type { ReportSummary } from "./types";

export function getReportSummary() {
  return apiFetch<ReportSummary>("/reports/summary");
}
