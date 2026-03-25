export class EBGError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'EBGError';
  }
}

export class DoubleEntryViolation extends EBGError {
  constructor(debit: number, credit: number) {
    super(
      `Double-entry violation: debit=${debit} credit=${credit}`,
      'GL_DOUBLE_ENTRY_VIOLATION',
      400,
    );
  }
}

export class ImmutabilityViolation extends EBGError {
  constructor(nodeType: string, nodeId: string) {
    super(
      `Cannot modify immutable ${nodeType} ${nodeId}`,
      'GL_IMMUTABILITY_VIOLATION',
      403,
    );
  }
}

export class OntologyBoundaryViolation extends EBGError {
  constructor(entityOntology: string, outcomeOntology: string) {
    super(
      `Ontology mismatch: entity=${entityOntology} outcome=${outcomeOntology}`,
      'ONTOLOGY_BOUNDARY_VIOLATION',
      400,
    );
  }
}

export class FundRequiredError extends EBGError {
  constructor(entityId: string) {
    super(
      `fund_id required for NFP entity ${entityId}`,
      'GL_FUND_REQUIRED',
      400,
    );
  }
}

export class FundNotAllowedError extends EBGError {
  constructor(entityId: string) {
    super(
      `Fund accounting not enabled for entity ${entityId}`,
      'FUND_NOT_ALLOWED',
      400,
    );
  }
}

export class PeriodClosedError extends EBGError {
  constructor(periodId: string, status: string) {
    super(
      `Cannot post to ${status} period ${periodId}`,
      'GL_PERIOD_CLOSED',
      400,
    );
  }
}

export class SagaRollbackError extends EBGError {
  constructor(sagaId: string, failedStep: string, cause: string) {
    super(
      `Saga ${sagaId} failed at step ${failedStep}: ${cause}`,
      'SAGA_ROLLBACK',
      500,
    );
  }
}

export class ClaimFullyRecognizedError extends EBGError {
  constructor(claimId: string) {
    super(
      `TemporalClaim ${claimId} is already fully recognized`,
      'CLAIM_FULLY_RECOGNIZED',
      400,
    );
  }
}

export class ClaimWrittenOffError extends EBGError {
  constructor(claimId: string) {
    super(
      `TemporalClaim ${claimId} has been written off`,
      'CLAIM_WRITTEN_OFF',
      400,
    );
  }
}

export class ConfigNotFoundError extends EBGError {
  constructor(key: string, scope: string) {
    super(
      `Configuration not found: ${key} (scope: ${scope})`,
      'CONFIG_NOT_FOUND',
      404,
    );
  }
}
