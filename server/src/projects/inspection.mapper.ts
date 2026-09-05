import { ForestInspectionDecisionType, Prisma } from '@prisma/client';
import type {
  ForestInspectionCheckpointItem,
  ForestInspectionMethodInput,
} from './types';

export const forestInspectionCheckpointIncludeConfig =
  Prisma.validator<Prisma.ForestInspectionCheckpointInclude>()({
    indicators: { orderBy: { code: 'asc' } },
    submissions: {
      orderBy: { submittedAt: 'desc' },
      take: 1,
      include: {
        decisions: {
          orderBy: { decidedAt: 'desc' },
          take: 1,
        },
      },
    },
  });

export type ForestInspectionCheckpointRecord =
  Prisma.ForestInspectionCheckpointGetPayload<{
    include: typeof forestInspectionCheckpointIncludeConfig;
  }>;

export function toForestInspectionCheckpointItem(
  checkpoint: ForestInspectionCheckpointRecord,
): ForestInspectionCheckpointItem {
  const latestSubmission = checkpoint.submissions[0] ?? null;
  const latestDecision = latestSubmission?.decisions[0] ?? null;

  return {
    id: checkpoint.id,
    sequenceNo: checkpoint.sequenceNo,
    title: checkpoint.title,
    scheduledAt: checkpoint.scheduledAt.toISOString(),
    submissionDeadline: checkpoint.submissionDeadline?.toISOString() ?? null,
    method: checkpoint.method.toLowerCase() as ForestInspectionMethodInput,
    instructions: checkpoint.instructions,
    status:
      checkpoint.status.toLowerCase() as ForestInspectionCheckpointItem['status'],
    indicators: checkpoint.indicators.map((indicator) => ({
      id: indicator.id,
      code: indicator.code,
      label: indicator.label,
      targetValue:
        indicator.targetValue === null ? null : Number(indicator.targetValue),
      unit: indicator.unit,
    })),
    latestSubmission: latestSubmission
      ? {
          id: latestSubmission.id,
          landName: latestSubmission.landName,
          actualSequestrationTCO2e: Number(
            latestSubmission.actualSequestrationTco2e,
          ),
          areaHectares:
            latestSubmission.areaHectares === null
              ? null
              : Number(latestSubmission.areaHectares),
          survivalRatePercent:
            latestSubmission.survivalRatePercent === null
              ? null
              : Number(latestSubmission.survivalRatePercent),
          canopyHeightMeters:
            latestSubmission.canopyHeightMeters === null
              ? null
              : Number(latestSubmission.canopyHeightMeters),
          ndviScore:
            latestSubmission.ndviScore === null
              ? null
              : Number(latestSubmission.ndviScore),
          notes: latestSubmission.notes,
          snapshotHash: latestSubmission.snapshotHash,
          status:
            latestSubmission.status.toLowerCase() as ForestInspectionCheckpointItem['status'],
          submittedAt: latestSubmission.submittedAt.toISOString(),
          submittedByUserId: latestSubmission.submittedByUserId,
          latestDecision: latestDecision
            ? {
                id: latestDecision.id,
                decision:
                  latestDecision.decision ===
                  ForestInspectionDecisionType.APPROVED
                    ? 'approved'
                    : 'request_revision',
                verifiedSequestrationTCO2e:
                  latestDecision.verifiedSequestrationTco2e === null
                    ? null
                    : Number(latestDecision.verifiedSequestrationTco2e),
                notes: latestDecision.notes,
                merkleRoot: latestDecision.merkleRoot,
                blockchainTxHash: latestDecision.blockchainTxHash,
                decidedAt: latestDecision.decidedAt.toISOString(),
                auditorUserId: latestDecision.auditorUserId,
              }
            : null,
        }
      : null,
  };
}
