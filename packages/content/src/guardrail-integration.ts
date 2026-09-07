/**
 * Guardrail Integration Manager
 * Automatically imports approved cards from Guardrail validation results into the content library.
 */

import type { GuardrailResponse } from '@fd/contracts';
import type { GameCard } from './chm-card-types';
import {
  CHM_CONSTRAINTS,
  isCommandSpellCard,
  isEventCard,
  isMasterIdentityCard,
  isSituationCard,
  isServantAttackCard,
  isServantOverviewCard,
} from './chm-card-types';

export interface GuardrailIntegrationConfig {
  structuredDataPath: string;
  guardrailDataPath: string;
  outputLibraryPath: string;
  autoApproveThreshold?: number;
}

export interface IntegrationReportDetail {
  cardId: string;
  status: 'approved' | 'rejected' | 'review_required';
  reason?: string;
  guardrailDecision: string;
}

export interface IntegrationReport {
  timestamp: string;
  cardsProcessed: number;
  cardsApproved: number;
  cardsRejected: number;
  details: IntegrationReportDetail[];
}

function cloneReport(report: IntegrationReport): IntegrationReport {
  return structuredClone(report);
}

function createEmptyReport(): IntegrationReport {
  return {
    timestamp: new Date().toISOString(),
    cardsProcessed: 0,
    cardsApproved: 0,
    cardsRejected: 0,
    details: [],
  };
}

export class GuardrailIntegrationManager {
  private readonly config: GuardrailIntegrationConfig;
  private report: IntegrationReport;

  constructor(config: GuardrailIntegrationConfig) {
    this.config = { ...config };
    this.report = createEmptyReport();
  }

  async processGuardrailResponses(
    guardrailResponses: GuardrailResponse[],
    approvedCards: GameCard[]
  ): Promise<IntegrationReport> {
    for (const response of guardrailResponses) {
      this.report.cardsProcessed++;

      if (response.decision === 'approve') {
        const approvedCard = approvedCards.find((card) => card.guardrailJobId === response.jobId);
        const cardId = approvedCard?.id ?? this.extractCardId(response);

        if (!approvedCard) {
          this.report.cardsRejected++;
          this.report.details.push(
            this.createDetail(cardId, 'rejected', response.decision, 'Approved card payload not found')
          );
          continue;
        }

        const validation = this.validateApprovedCard(approvedCard);
        if (validation.isValid) {
          this.report.cardsApproved++;
          this.report.details.push(this.createDetail(cardId, 'approved', response.decision));
        } else {
          this.report.cardsRejected++;
          this.report.details.push(
            this.createDetail(cardId, 'rejected', response.decision, validation.error)
          );
        }
        continue;
      }

      if (response.decision === 'review') {
        this.report.details.push(
          this.createDetail(this.extractCardId(response), 'review_required', response.decision, 'Requires human review')
        );
        continue;
      }

      this.report.cardsRejected++;
      this.report.details.push(
        this.createDetail(this.extractCardId(response), 'rejected', response.decision, 'Guardrail rejected')
      );
    }

    return cloneReport(this.report);
  }

  getConfig(): GuardrailIntegrationConfig {
    return { ...this.config };
  }

  private validateApprovedCard(card: GameCard): { isValid: true } | { isValid: false; error: string } {
    if (!card.id || !card.name || !card.namespace) {
      return { isValid: false, error: 'Missing required metadata' };
    }

    if (isMasterIdentityCard(card)) {
      if (card.initialMana !== CHM_CONSTRAINTS.master.initialMana) {
        return {
          isValid: false,
          error: `Master initial mana must be ${CHM_CONSTRAINTS.master.initialMana}`,
        };
      }
      if (card.commandSpells !== CHM_CONSTRAINTS.master.commandSpells) {
        return {
          isValid: false,
          error: `Master command spells must be ${CHM_CONSTRAINTS.master.commandSpells}`,
        };
      }
      return { isValid: true };
    }

    if (isServantOverviewCard(card)) {
      if (card.attackCardsCount !== CHM_CONSTRAINTS.servant.attackCardsCount) {
        return {
          isValid: false,
          error: `Servant must have ${CHM_CONSTRAINTS.servant.attackCardsCount} attack cards`,
        };
      }
      if (card.skillCardsCount !== CHM_CONSTRAINTS.servant.skillCardsCount) {
        return {
          isValid: false,
          error: `Servant must have ${CHM_CONSTRAINTS.servant.skillCardsCount} skill cards`,
        };
      }
      return { isValid: true };
    }

    if (isServantAttackCard(card)) {
      if (typeof card.magicCost !== 'number' || typeof card.basePower !== 'number') {
        return {
          isValid: false,
          error: 'Servant attack must have magic cost and base power',
        };
      }
      return { isValid: true };
    }

    if (isSituationCard(card)) {
      if (
        card.situationType === 'climax' &&
        (!card.applicableRounds ||
          !CHM_CONSTRAINTS.situation.climaxRounds.every((round) => card.applicableRounds?.includes(round)))
      ) {
        return {
          isValid: false,
          error: `Climax situation must apply to rounds ${CHM_CONSTRAINTS.situation.climaxRounds.join(', ')}`,
        };
      }
      return { isValid: true };
    }

    if (isEventCard(card)) {
      const expectedReward =
        card.battlefield === 'deep_mountain'
          ? CHM_CONSTRAINTS.event.deepMountainCompetitionReward
          : CHM_CONSTRAINTS.event.newCapitalCompetitionReward;
      if (card.competitionReward !== expectedReward) {
        return {
          isValid: false,
          error: `Event competition reward for ${card.battlefield} must be ${expectedReward}`,
        };
      }
      return { isValid: true };
    }

    if (isCommandSpellCard(card) && !CHM_CONSTRAINTS.commandSpell.usageTypes.includes(card.usage)) {
      return {
        isValid: false,
        error: `Invalid command spell usage: ${card.usage}`,
      };
    }

    return { isValid: true };
  }

  private extractCardId(response: GuardrailResponse): string {
    return response.source.structureJobId || response.jobId;
  }

  private createDetail(
    cardId: string,
    status: IntegrationReportDetail['status'],
    guardrailDecision: string,
    reason?: string
  ): IntegrationReportDetail {
    if (reason) {
      return { cardId, status, reason, guardrailDecision };
    }
    return { cardId, status, guardrailDecision };
  }

  getReportSummary(): string {
    const { cardsProcessed, cardsApproved, cardsRejected } = this.report;
    const reviewRequired = this.report.details.filter((detail) => detail.status === 'review_required').length;
    const approvalRate = cardsProcessed === 0 ? 0 : (cardsApproved / cardsProcessed) * 100;

    return [
      'Integration Report',
      '==================',
      `Timestamp: ${this.report.timestamp}`,
      `Cards Processed: ${cardsProcessed}`,
      `Cards Approved: ${cardsApproved}`,
      `Cards Rejected: ${cardsRejected}`,
      `Review Required: ${reviewRequired}`,
      `Approval Rate: ${approvalRate.toFixed(2)}%`,
    ].join('\n');
  }

  getFullReport(): IntegrationReport {
    return cloneReport(this.report);
  }
}
