import { runServantPageWorkflow } from '../packages/pipeline/src';
import type { VisionResponse } from '../packages/contracts/src';
import type { CardExtractionDraft } from '../packages/pipeline/src';

export async function runServantPageWorkflowScript(input: {
  projectRoot: string;
  htmPath: string;
  artifactsByImage?: Record<string, { visionArtifact: VisionResponse; draft?: CardExtractionDraft }>;
}) {
  return runServantPageWorkflow(input);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const [, , htmPath, projectRoot = 'D:/fd'] = process.argv;

  if (!htmPath) {
    throw new Error('Usage: tsx scripts/run-servant-page-workflow.ts <htmPath> [projectRoot]');
  }

  runServantPageWorkflowScript({ projectRoot, htmPath })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
