export interface SampleCardManifestItem {
  id: string;
  imagePath: string;
  sourcePage?: string;
  sourceSet: string;
  familyHint?: string;
  layoutHint?: string;
  language: string;
  targetNamespace: string;
  tags?: string[];
}

export interface SampleCardManifest {
  manifestVersion: "sample-manifest-v1";
  name: string;
  description?: string;
  items: SampleCardManifestItem[];
}
