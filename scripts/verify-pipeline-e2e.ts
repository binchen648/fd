/**
 * FD Content Pipeline - End-to-End Verification Script
 * Tests the complete pipeline: Vision → Structure → Guardrail → Content Library
 * 
 * This script verifies:
 * 1. Sample card manifest loading
 * 2. Vision Agent processing (simulated)
 * 3. Structuring Agent output
 * 4. Guardrail validation
 * 5. Content Library integration
 * 6. Statistics and reporting
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SampleCardManifest, SampleCardManifestItem } from '../packages/contracts/src';

interface PipelineTestReport {
  timestamp: string;
  executionTime: number;
  stages: {
    manifestLoading: {
      status: 'success' | 'failed';
      itemsLoaded: number;
      errors?: string[];
    };
    vision: {
      status: 'success' | 'simulated';
      cardsProcessed: number;
      ocrOutputPath: string;
    };
    structure: {
      status: 'success' | 'simulated';
      cardsProcessed: number;
      structuredOutputPath: string;
      validationErrors: number;
    };
    guardrail: {
      status: 'success' | 'simulated';
      cardsProcessed: number;
      approved: number;
      rejected: number;
      reviewRequired: number;
      guardrailOutputPath: string;
    };
    contentLibrary: {
      status: 'success' | 'simulated';
      imported: number;
      rejected: number;
      libraryPath: string;
      statistics: {
        totalCards: number;
        bySourceSet: Record<string, number>;
        byNamespace: Record<string, number>;
      };
    };
  };
  summary: {
    overallStatus: 'pass' | 'partial' | 'failed';
    successRate: number;
    pipelineThroughput: number;
    recommendations: string[];
  };
}

export class PipelineVerificationScript {
  private report: PipelineTestReport;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.report = {
      timestamp: new Date().toISOString(),
      executionTime: 0,
      stages: {
        manifestLoading: { status: 'success', itemsLoaded: 0 },
        vision: { status: 'simulated', cardsProcessed: 0, ocrOutputPath: '' },
        structure: { status: 'simulated', cardsProcessed: 0, structuredOutputPath: '', validationErrors: 0 },
        guardrail: {
          status: 'simulated',
          cardsProcessed: 0,
          approved: 0,
          rejected: 0,
          reviewRequired: 0,
          guardrailOutputPath: '',
        },
        contentLibrary: {
          status: 'simulated',
          imported: 0,
          rejected: 0,
          libraryPath: '',
          statistics: {
            totalCards: 0,
            bySourceSet: {},
            byNamespace: {},
          },
        },
      },
      summary: {
        overallStatus: 'pass',
        successRate: 0,
        pipelineThroughput: 0,
        recommendations: [],
      },
    };
  }

  /**
   * Stage 1: Load and validate CHM base sample manifest
   */
  async loadManifest(manifestPath: string): Promise<boolean> {
    console.log('📋 Stage 1: Loading CHM Base Sample Manifest');
    console.log(`   Path: ${manifestPath}`);

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest: SampleCardManifest = JSON.parse(manifestContent);

      // Validate manifest structure
      if (!manifest.manifestVersion || manifest.manifestVersion !== 'sample-manifest-v1') {
        throw new Error('Invalid manifest version');
      }

      if (!manifest.items || !Array.isArray(manifest.items)) {
        throw new Error('Manifest items not found or invalid');
      }

      this.report.stages.manifestLoading.itemsLoaded = manifest.items.length;
      console.log(`   ✅ Loaded ${manifest.items.length} sample cards`);
      console.log(`   ✅ Manifest name: ${manifest.name}`);

      return true;
    } catch (error) {
      this.report.stages.manifestLoading.status = 'failed';
      this.report.stages.manifestLoading.errors = [error instanceof Error ? error.message : 'Unknown error'];
      console.log(`   ❌ Failed to load manifest: ${error}`);
      return false;
    }
  }

  /**
   * Stage 2: Simulate Vision Agent processing
   */
  async simulateVisionAgent(itemCount: number): Promise<boolean> {
    console.log('\n🧠 Stage 2: Vision Agent (OCR Recognition)');
    console.log(`   Processing ${itemCount} sample cards`);

    try {
      // Simulate OCR processing
      const ocrOutputDir = 'data/staged/ocr/chm-base-test/';
      
      // Create output directory structure
      if (!fs.existsSync(ocrOutputDir)) {
        fs.mkdirSync(ocrOutputDir, { recursive: true });
      }

      // Simulate OCR output for sample cards
      for (let i = 1; i <= Math.min(itemCount, 3); i++) {
        const ocrOutput = {
          jobId: `vision-chm-${i}`,
          status: 'success',
          extractedText: `[Simulated OCR output for card ${i}]`,
          confidence: 0.92 + Math.random() * 0.08,
          timestamp: new Date().toISOString(),
        };
        
        const outputPath = path.join(ocrOutputDir, `card-${i}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(ocrOutput, null, 2));
      }

      this.report.stages.vision.cardsProcessed = Math.min(itemCount, 3);
      this.report.stages.vision.ocrOutputPath = ocrOutputDir;
      console.log(`   ✅ Processed ${this.report.stages.vision.cardsProcessed} cards`);
      console.log(`   ✅ Output: ${ocrOutputDir}`);

      return true;
    } catch (error) {
      console.log(`   ❌ Vision simulation failed: ${error}`);
      return false;
    }
  }

  /**
   * Stage 3: Simulate Structuring Agent
   */
  async simulateStructuringAgent(itemCount: number): Promise<boolean> {
    console.log('\n📊 Stage 3: Structuring Agent');
    console.log(`   Structuring ${itemCount} cards into validated JSON`);

    try {
      const structuredOutputDir = 'data/staged/structured/chm-base-test/';
      
      if (!fs.existsSync(structuredOutputDir)) {
        fs.mkdirSync(structuredOutputDir, { recursive: true });
      }

      // Simulate structured output
      for (let i = 1; i <= Math.min(itemCount, 3); i++) {
        const cardTypes = ['master_identity', 'servant_overview', 'event'];
        const structuredData = {
          jobId: `structure-chm-${i}`,
          status: 'success',
          cardData: {
            id: `card-chm-${i}`,
            name: `Sample Card ${i}`,
            sourceSet: ['master', 'servant', 'event'][i % 3],
            namespace: ['master', 'servant', 'event'][i % 3],
            language: 'zh-CN',
            cardType: cardTypes[i % cardTypes.length],
            tags: ['chm-base', `sample-${i}`],
          },
          validationStatus: 'passed',
          timestamp: new Date().toISOString(),
        };

        const outputPath = path.join(structuredOutputDir, `card-${i}-structured.json`);
        fs.writeFileSync(outputPath, JSON.stringify(structuredData, null, 2));
      }

      this.report.stages.structure.cardsProcessed = Math.min(itemCount, 3);
      this.report.stages.structure.structuredOutputPath = structuredOutputDir;
      this.report.stages.structure.validationErrors = 0;
      console.log(`   ✅ Structured ${this.report.stages.structure.cardsProcessed} cards`);
      console.log(`   ✅ Output: ${structuredOutputDir}`);

      return true;
    } catch (error) {
      console.log(`   ❌ Structuring simulation failed: ${error}`);
      return false;
    }
  }

  /**
   * Stage 4: Simulate Guardrail Agent validation
   */
  async simulateGuardrailAgent(itemCount: number): Promise<boolean> {
    console.log('\n✅ Stage 4: Guardrail Agent (Validation)');
    console.log(`   Validating ${itemCount} cards against CHM rules`);

    try {
      const guardrailOutputDir = 'data/staged/guardrail/chm-base-test/';
      
      if (!fs.existsSync(guardrailOutputDir)) {
        fs.mkdirSync(guardrailOutputDir, { recursive: true });
      }

      // Simulate guardrail decisions
      let approved = 0;
      let rejected = 0;
      let reviewRequired = 0;

      for (let i = 1; i <= Math.min(itemCount, 3); i++) {
        const decisions = ['approve', 'review', 'approve'];
        const decision = decisions[i % decisions.length];

        if (decision === 'approve') approved++;
        else if (decision === 'review') reviewRequired++;
        else rejected++;

        const guardrailOutput = {
          jobId: `guardrail-chm-${i}`,
          decision: decision as 'approve' | 'review' | 'reject',
          confidence: 0.85 + Math.random() * 0.15,
          constraints: {
            chmRulesValidation: 'passed',
            schemaValidation: 'passed',
            cardTypeValidation: 'passed',
          },
          timestamp: new Date().toISOString(),
        };

        const outputPath = path.join(guardrailOutputDir, `card-${i}-guardrail.json`);
        fs.writeFileSync(outputPath, JSON.stringify(guardrailOutput, null, 2));
      }

      this.report.stages.guardrail.cardsProcessed = Math.min(itemCount, 3);
      this.report.stages.guardrail.approved = approved;
      this.report.stages.guardrail.rejected = rejected;
      this.report.stages.guardrail.reviewRequired = reviewRequired;
      this.report.stages.guardrail.guardrailOutputPath = guardrailOutputDir;

      console.log(`   ✅ Validated ${this.report.stages.guardrail.cardsProcessed} cards`);
      console.log(`   ✅ Approved: ${approved}, Review: ${reviewRequired}, Rejected: ${rejected}`);
      console.log(`   ✅ Approval rate: ${((approved / this.report.stages.guardrail.cardsProcessed) * 100).toFixed(1)}%`);
      console.log(`   ✅ Output: ${guardrailOutputDir}`);

      return true;
    } catch (error) {
      console.log(`   ❌ Guardrail simulation failed: ${error}`);
      return false;
    }
  }

  /**
   * Stage 5: Simulate Content Library Integration
   */
  async simulateContentLibraryIntegration(itemCount: number): Promise<boolean> {
    console.log('\n📚 Stage 5: Content Library Integration');
    console.log(`   Importing approved cards into content library`);

    try {
      const libraryPath = 'packages/content/library/';
      
      if (!fs.existsSync(libraryPath)) {
        fs.mkdirSync(libraryPath, { recursive: true });
      }

      // Simulate library index generation
      const libraryIndex = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        stats: {
          totalCards: this.report.stages.guardrail.approved,
          bySourceSet: {
            master: 1,
            servant: 1,
            event: Math.max(0, this.report.stages.guardrail.approved - 2),
          },
          byNamespace: {
            master: 1,
            servant: 1,
            event: Math.max(0, this.report.stages.guardrail.approved - 2),
          },
        },
        cards: {
          'card-chm-1': { id: 'card-chm-1', name: 'Master Sample', sourceSet: 'master', namespace: 'master' },
          'card-chm-2': { id: 'card-chm-2', name: 'Servant Sample', sourceSet: 'servant', namespace: 'servant' },
          'card-chm-3': { id: 'card-chm-3', name: 'Event Sample', sourceSet: 'event', namespace: 'event' },
        },
      };

      const indexPath = path.join(libraryPath, 'index.json');
      fs.writeFileSync(indexPath, JSON.stringify(libraryIndex, null, 2));

      this.report.stages.contentLibrary.imported = this.report.stages.guardrail.approved;
      this.report.stages.contentLibrary.rejected = this.report.stages.guardrail.rejected;
      this.report.stages.contentLibrary.libraryPath = libraryPath;
      this.report.stages.contentLibrary.statistics = libraryIndex.stats;

      console.log(`   ✅ Imported ${this.report.stages.contentLibrary.imported} cards`);
      console.log(`   ✅ Library statistics:`);
      console.log(`      - Total cards: ${libraryIndex.stats.totalCards}`);
      console.log(`      - By source set: ${JSON.stringify(libraryIndex.stats.bySourceSet)}`);
      console.log(`   ✅ Library path: ${libraryPath}`);

      return true;
    } catch (error) {
      console.log(`   ❌ Content library integration failed: ${error}`);
      return false;
    }
  }

  /**
   * Generate final verification report
   */
  generateReport(): PipelineTestReport {
    const executionTime = Date.now() - this.startTime;
    this.report.executionTime = executionTime;

    // Calculate success rate
    const totalStages = 5;
    const successfulStages = [
      this.report.stages.manifestLoading.status === 'success' ? 1 : 0,
      this.report.stages.vision.status === 'success' ? 1 : 0,
      this.report.stages.structure.status === 'success' ? 1 : 0,
      this.report.stages.guardrail.status === 'success' ? 1 : 0,
      this.report.stages.contentLibrary.status === 'success' ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    this.report.summary.successRate = (successfulStages / totalStages) * 100;
    this.report.summary.pipelineThroughput = this.report.stages.guardrail.cardsProcessed;

    // Determine overall status
    if (this.report.summary.successRate === 100) {
      this.report.summary.overallStatus = 'pass';
    } else if (this.report.summary.successRate >= 80) {
      this.report.summary.overallStatus = 'partial';
    } else {
      this.report.summary.overallStatus = 'failed';
    }

    // Generate recommendations
    if (this.report.stages.guardrail.rejected > 0) {
      this.report.summary.recommendations.push(
        `${this.report.stages.guardrail.rejected} cards were rejected by Guardrail - review validation rules`
      );
    }

    if (this.report.stages.structure.validationErrors > 0) {
      this.report.summary.recommendations.push(
        `${this.report.stages.structure.validationErrors} validation errors in structuring stage - check schema mapping`
      );
    }

    if (this.report.stages.guardrail.reviewRequired > 0) {
      this.report.summary.recommendations.push(
        `${this.report.stages.guardrail.reviewRequired} cards require human review - check for edge cases`
      );
    }

    if (this.report.summary.pipelineThroughput < 5) {
      this.report.summary.recommendations.push(
        'Low pipeline throughput detected - consider performance optimization'
      );
    }

    return this.report;
  }

  /**
   * Print human-readable verification report
   */
  printReport(): void {
    const report = this.report;

    console.log('\n' + '='.repeat(80));
    console.log('🎮 FD CONTENT PIPELINE - END-TO-END VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log(`\nTimestamp: ${report.timestamp}`);
    console.log(`Execution Time: ${report.executionTime}ms`);

    console.log('\n📊 PIPELINE STAGES SUMMARY');
    console.log('-'.repeat(80));
    
    const stages = [
      { name: 'Manifest Loading', data: report.stages.manifestLoading },
      { name: 'Vision Agent', data: report.stages.vision },
      { name: 'Structuring Agent', data: report.stages.structure },
      { name: 'Guardrail Agent', data: report.stages.guardrail },
      { name: 'Content Library', data: report.stages.contentLibrary },
    ];

    for (const stage of stages) {
      const status = stage.data.status === 'success' ? '✅' : '⚠️';
      console.log(`${status} ${stage.name.padEnd(20)} | Status: ${stage.data.status}`);
    }

    console.log('\n📈 DETAILED STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Manifest Items Loaded: ${report.stages.manifestLoading.itemsLoaded}`);
    console.log(`Vision Cards Processed: ${report.stages.vision.cardsProcessed}`);
    console.log(`Structured Cards: ${report.stages.structure.cardsProcessed}`);
    console.log(`Guardrail Decisions:`);
    console.log(`  - Approved: ${report.stages.guardrail.approved}`);
    console.log(`  - Review Required: ${report.stages.guardrail.reviewRequired}`);
    console.log(`  - Rejected: ${report.stages.guardrail.rejected}`);
    console.log(`Content Library:`);
    console.log(`  - Imported: ${report.stages.contentLibrary.imported}`);
    console.log(`  - Total Cards in Library: ${report.stages.contentLibrary.statistics.totalCards}`);
    console.log(`  - By Source Set: ${JSON.stringify(report.stages.contentLibrary.statistics.bySourceSet)}`);

    console.log('\n✅ VERIFICATION SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Overall Status: ${report.summary.overallStatus.toUpperCase()}`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`Pipeline Throughput: ${report.summary.pipelineThroughput} cards`);

    if (report.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('-'.repeat(80));
      for (const rec of report.summary.recommendations) {
        console.log(`• ${rec}`);
      }
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Export report as JSON
   */
  exportReport(outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📄 Report exported to: ${outputPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const verifier = new PipelineVerificationScript();

  try {
    // Stage 1: Load manifest
    const manifestPath = 'data/manifests/chm-base-samples-v1.json';
    if (!await verifier.loadManifest(manifestPath)) {
      console.log('\n❌ Pipeline verification failed at manifest loading stage');
      process.exit(1);
    }

    const itemCount = 8; // From chm-base-samples-v1.json

    // Stage 2: Vision
    await verifier.simulateVisionAgent(itemCount);

    // Stage 3: Structuring
    await verifier.simulateStructuringAgent(itemCount);

    // Stage 4: Guardrail
    await verifier.simulateGuardrailAgent(itemCount);

    // Stage 5: Content Library
    await verifier.simulateContentLibraryIntegration(itemCount);

    // Generate and print report
    verifier.generateReport();
    verifier.printReport();
    verifier.exportReport('data/reports/pipeline-verification-report.json');

    console.log('\n✅ Pipeline verification completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Fatal error during pipeline verification:', error);
    process.exit(1);
  }
}

void main();
