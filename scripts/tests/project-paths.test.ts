import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  portableDirBasename,
  portableStem,
  repositoryRoot,
  resolveRepositoryPath,
} from "../project-paths";

describe("project path helpers", () => {
  it("derives repository paths from the active checkout", () => {
    expect(repositoryRoot).toBe(path.resolve("."));
    expect(resolveRepositoryPath("data", "manifests", "sample-cards.json")).toBe(
      path.resolve("data", "manifests", "sample-cards.json"),
    );
  });

  it("does not bake in the historical D drive checkout", () => {
    expect(resolveRepositoryPath("data", "manifests", "sample-cards.json")).not.toBe(
      String.raw`D:\fd\data\manifests\sample-cards.json`,
    );
  });

  it("reads equivalent Windows and POSIX labels from either separator style", () => {
    const windowsPath = String.raw`D:\fd\data\staged\generated-scenarios\master_skill\mana-burst.json`;
    const posixPath = "/home/runner/work/fd/fd/data/staged/generated-scenarios/master_skill/mana-burst.json";

    expect(portableDirBasename(windowsPath)).toBe("master_skill");
    expect(portableDirBasename(posixPath)).toBe("master_skill");
    expect(portableStem(windowsPath)).toBe("mana-burst");
    expect(portableStem(posixPath)).toBe("mana-burst");
  });
});
