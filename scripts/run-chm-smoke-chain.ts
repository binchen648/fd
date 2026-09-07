import type { GuardrailRequest, StructuringRequest, VisionRequest } from '../packages/contracts/src';
import { loadProviderConfig } from '../packages/providers/src';
import {
  buildAgentProviderSelection,
  providerDefaultsFromConfig,
  runSmokeChain,
} from '../packages/pipeline/src';

const CONFIG_PATH = 'D:\\\\fd\\\\config\\\\providers\\\\siliconflow.example.json';

async function testCHMBaseCard(imagePath: string, sourceSet: string, familyHint: string, namespace: string, jobId: string) {
  const providerDefaults = providerDefaultsFromConfig(await loadProviderConfig(CONFIG_PATH));
  
  const visionRequest: VisionRequest = {
    jobId: jobId + '-vision',
    artifactVersion: 'vision-request-v1',
    input: {
      imagePath,
      sourceSet,
      familyHint,
      layoutHint: 'single_card_vertical',
      language: 'zh-CN',
    },
    provider: buildAgentProviderSelection('vision', 'accuracy', providerDefaults),
  };

  const result = await runSmokeChain({
    configPath: CONFIG_PATH,
    visionRequest,
    structureRequestFactory: (_vision, visionResultPath): StructuringRequest => ({
      jobId: jobId + '-structure',
      artifactVersion: 'structure-request-v1',
      input: {
        visionResultPath,
        schemaVersion: 'fd-card-schema-v1',
        keywordDictionaryVersion: 'fd-keywords-v1',
        targetNamespace: namespace,
      },
      provider: buildAgentProviderSelection('structure', 'accuracy', providerDefaults),
    }),
    guardrailRequestFactory: ({ visionResultPath, structureResultPath }): GuardrailRequest => ({
      jobId: jobId + '-guardrail',
      artifactVersion: 'guardrail-request-v1',
      input: {
        visionResultPath,
        structureResultPath,
        schemaVersion: 'fd-card-schema-v1',
        engineCapabilityVersion: 'fd-engine-capability-v1',
      },
      provider: buildAgentProviderSelection('guardrail', 'review', providerDefaults),
    }),
  });

  return result;
}

async function main() {
  console.log(' CHM Base Game - Smoke Chain E2E Test');
  console.log('======================================\n');

  try {
    // Test 1: Master Identity
    console.log(' Test 1: Master Identity Card');
    const result1 = await testCHMBaseCard(
      'D:\\\\fd\\\\chm-extract\\\\间桐慎二.htm',
      'master',
      'master_identity',
      'master',
      'chm-test-001'
    );
    console.log(' Vision Status:', result1.vision.status);
    console.log(' Structure Status:', result1.structured.status);
    console.log(' Guardrail Decision:', result1.guardrail.decision);
    console.log();

    // Test 2: Servant Overview
    console.log(' Test 2: Servant Overview Card');
    const result2 = await testCHMBaseCard(
      'D:\\\\fd\\\\chm-extract\\\\七夜志贵.htm',
      'servant',
      'servant_overview',
      'servant',
      'chm-test-002'
    );
    console.log(' Vision Status:', result2.vision.status);
    console.log(' Structure Status:', result2.structured.status);
    console.log(' Guardrail Decision:', result2.guardrail.decision);
    console.log();

    // Test 3: Servant Attack
    console.log(' Test 3: Servant Attack Card');
    const result3 = await testCHMBaseCard(
      'D:\\\\fd\\\\chm-extract\\\\七夜志贵【杀】.htm',
      'servant',
      'servant_attack',
      'servant',
      'chm-test-003'
    );
    console.log(' Vision Status:', result3.vision.status);
    console.log(' Structure Status:', result3.structured.status);
    console.log(' Guardrail Decision:', result3.guardrail.decision);
    console.log();

    // Test 4: Situation Card
    console.log(' Test 4: Situation Card (Regular)');
    const result4 = await testCHMBaseCard(
      'D:\\\\fd\\\\chm-extract\\\\不列颠异闻带.htm',
      'situation',
      'situation_regular',
      'situation',
      'chm-test-004'
    );
    console.log(' Vision Status:', result4.vision.status);
    console.log(' Structure Status:', result4.structured.status);
    console.log(' Guardrail Decision:', result4.guardrail.decision);
    console.log();

    // Test 5: Event Card
    console.log(' Test 5: Event Card');
    const result5 = await testCHMBaseCard(
      'D:\\\\fd\\\\chm-extract\\\\事件.htm',
      'event',
      'event_deep_mountain',
      'event',
      'chm-test-005'
    );
    console.log(' Vision Status:', result5.vision.status);
    console.log(' Structure Status:', result5.structured.status);
    console.log(' Guardrail Decision:', result5.guardrail.decision);
    console.log();

    console.log(' All CHM Base Game smoke chain tests completed!');
  } catch (error) {
    console.error(' Error during smoke chain tests:', error);
    process.exit(1);
  }
}

void main();
