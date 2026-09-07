export interface ServantReviewDraftPage {
  pageName: string;
  sourceHtm: string;
  status: 'review_required';
  reason: string;
  draftArtifacts: string[];
}

export interface ServantReviewDraftIndex {
  version: 'servant-review-draft-v1';
  lastUpdated: string;
  pages: Record<string, ServantReviewDraftPage>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDraftPage(value: unknown): value is ServantReviewDraftPage {
  return (
    isRecord(value) &&
    typeof value.pageName === 'string' &&
    typeof value.sourceHtm === 'string' &&
    value.status === 'review_required' &&
    typeof value.reason === 'string' &&
    Array.isArray(value.draftArtifacts) &&
    value.draftArtifacts.every((entry) => typeof entry === 'string')
  );
}

export function isServantReviewDraftIndex(value: unknown): value is ServantReviewDraftIndex {
  return (
    isRecord(value) &&
    value.version === 'servant-review-draft-v1' &&
    typeof value.lastUpdated === 'string' &&
    !Number.isNaN(Date.parse(value.lastUpdated)) &&
    isRecord(value.pages) &&
    Object.values(value.pages).every((entry) => isDraftPage(entry))
  );
}

export function assertServantReviewDraftIndex(
  value: unknown,
  label = 'servant review draft index',
): asserts value is ServantReviewDraftIndex {
  if (!isServantReviewDraftIndex(value)) {
    throw new Error(`Invalid ${label} structure`);
  }
}

export function cloneServantReviewDraftIndex(index: ServantReviewDraftIndex): ServantReviewDraftIndex {
  return structuredClone(index);
}
