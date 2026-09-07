import path from "node:path";

import { extractImageSourcesFromHtml } from "./servant-main-card";

export interface ServantHtmUnit {
  htm_name: string;
  source_html: string;
  page_title: string | null;
  png_paths: string[];
  section: string | null;
  group: string | null;
}

export interface ServantStagingPaths {
  htmName: string;
  stagingDir: string;
  reviewPendingDir: string;
}

export function parseServantHtmUnit(htmPath: string, html: string): ServantHtmUnit {
  const normalizedHtmPath = normalizePath(htmPath);
  const htmName = path.basename(htmPath, path.extname(htmPath));
  const pageTitle = extractPageTitle(html) ?? htmName;
  const imageDir = normalizePath(path.join(path.dirname(htmPath), "图包"));

  return {
    htm_name: htmName,
    source_html: normalizedHtmPath,
    page_title: pageTitle,
    png_paths: extractOrderedPngRefs(html).map((fileName) => normalizePath(path.join(imageDir, fileName))),
    section: null,
    group: null,
  };
}

export function extractOrderedPngRefs(html: string): string[] {
  return extractImageSourcesFromHtml(html).filter((fileName) => fileName.toLowerCase().endsWith(".png"));
}

export function buildServantStagingPaths(projectRoot: string, htmPath: string): ServantStagingPaths {
  const htmName = path.basename(htmPath, path.extname(htmPath));

  return {
    htmName,
    stagingDir: path.join(projectRoot, "data", "staged", "staging", htmName),
    reviewPendingDir: path.join(projectRoot, "data", "staged", "review-pending", htmName),
  };
}

function extractPageTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    return normalizeWhitespace(stripTags(titleMatch[1]));
  }

  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headingMatch?.[1]) {
    return normalizeWhitespace(stripTags(headingMatch[1]));
  }

  return null;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string): string {
  const normalized = value.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : "";
}

function normalizePath(filePath: string): string {
  return filePath.split("\\").join("/");
}
