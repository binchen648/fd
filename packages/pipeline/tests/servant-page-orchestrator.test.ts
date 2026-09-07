import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildServantStagingPaths,
  extractOrderedPngRefs,
  parseServantHtmUnit,
} from "../src/servant-page-orchestrator";

describe("servant page orchestrator", () => {
  it("extracts servant screenshot references in document order", () => {
    const html = [
      '<h1>阿尔托莉雅·潘德拉贡(Lancer)</h1>',
      '<img src="../template2/btn_prev_n.gif">',
      '<img src="图包/ScreenShot_2025-11-01_100000_001.png">',
      '<img src="图包/图片_说明.jpg">',
      '<img src="图包/ScreenShot_2025-11-01_100005_002.png">',
    ].join("");

    expect(extractOrderedPngRefs(html)).toEqual([
      "ScreenShot_2025-11-01_100000_001.png",
      "ScreenShot_2025-11-01_100005_002.png",
    ]);
  });

  it("parses one HTM page into a neutral staging unit keyed by the HTM basename", () => {
    const htmPath = "D:/fd/chm-extract/阿尔托莉雅·潘德拉贡(Lancer).htm";
    const html = [
      '<html><head><title>阿尔托莉雅·潘德拉贡(Lancer)</title></head>',
      '<body><h1>阿尔托莉雅·潘德拉贡(Lancer)</h1>',
      '<img src="图包/ScreenShot_2025-11-01_100000_001.png">',
      '<img src="图包/ScreenShot_2025-11-01_100005_002.png"></body></html>',
    ].join("");

    expect(parseServantHtmUnit(htmPath, html)).toEqual({
      htm_name: "阿尔托莉雅·潘德拉贡(Lancer)",
      source_html: "D:/fd/chm-extract/阿尔托莉雅·潘德拉贡(Lancer).htm",
      page_title: "阿尔托莉雅·潘德拉贡(Lancer)",
      png_paths: [
        "D:/fd/chm-extract/图包/ScreenShot_2025-11-01_100000_001.png",
        "D:/fd/chm-extract/图包/ScreenShot_2025-11-01_100005_002.png",
      ],
      section: null,
      group: null,
    });
  });

  it("builds staging paths before any servant naming happens", () => {
    expect(
      buildServantStagingPaths("D:/fd", "D:/fd/chm-extract/阿尔托莉雅·潘德拉贡(Lancer).htm"),
    ).toEqual({
      htmName: "阿尔托莉雅·潘德拉贡(Lancer)",
      stagingDir: path.join("D:/fd", "data", "staged", "staging", "阿尔托莉雅·潘德拉贡(Lancer)"),
      reviewPendingDir: path.join("D:/fd", "data", "staged", "review-pending", "阿尔托莉雅·潘德拉贡(Lancer)"),
    });
  });
});
