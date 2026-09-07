import {
  assertContentLibraryIndex,
  type ContentLibraryIndex,
} from '@fd/content/schema';
import {
  createSeededGameStateFromContentLibrary,
  type SeededStateOptions,
} from '@fd/rules/client';

export interface LoadedContentLibraryState {
  contentLibrary: ContentLibraryIndex;
  rulesState: ReturnType<typeof createSeededGameStateFromContentLibrary>;
}

export function buildRulesStateFromContentLibraryText(
  text: string,
  options?: Omit<SeededStateOptions, 'contentLibrary'>,
): ReturnType<typeof createSeededGameStateFromContentLibrary> {
  const parsed: unknown = JSON.parse(text);
  assertContentLibraryIndex(parsed, 'content library json');
  return createSeededGameStateFromContentLibrary(parsed, options);
}

export async function buildLoadedContentLibraryStateFromFile(
  file: File,
  options?: Omit<SeededStateOptions, 'contentLibrary'>,
): Promise<LoadedContentLibraryState> {
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);
  assertContentLibraryIndex(parsed, 'content library json');

  return {
    contentLibrary: parsed,
    rulesState: createSeededGameStateFromContentLibrary(parsed, options),
  };
}
