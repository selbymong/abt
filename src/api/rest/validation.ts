import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * Returns 400 with structured errors on failure.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// --- Journal Entry schemas ---

const ledgerLineSchema = z.object({
  side: z.enum(['DEBIT', 'CREDIT']),
  amount: z.number().positive(),
  nodeRefId: z.string().uuid(),
  nodeRefType: z.string().min(1),
  economicCategory: z.string().min(1),
  fundId: z.string().uuid().optional(),
  fxRate: z.number().positive().optional(),
});

export const postJournalEntrySchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  entryType: z.string().min(1),
  reference: z.string().min(1),
  narrative: z.string().min(1),
  currency: z.string().length(3),
  validDate: z.string().min(1),
  approvedBy: z.string().optional(),
  sourceSystem: z.string().optional(),
  lines: z.array(ledgerLineSchema).min(1),
});

// --- Period lifecycle ---

export const periodActionSchema = z.object({
  closedBy: z.string().min(1).optional(),
  reopenedBy: z.string().min(1).optional(),
});

// --- Provision ---

export const createProvisionSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  name: z.string().min(1),
  provisionType: z.enum([
    'WARRANTY', 'RESTRUCTURING', 'LEGAL_CLAIM',
    'ENVIRONMENTAL', 'ONEROUS_CONTRACT', 'DECOMMISSIONING',
  ]),
  probability: z.enum(['PROBABLE', 'POSSIBLE', 'REMOTE']),
  bestEstimate: z.number().nonnegative(),
  lowEstimate: z.number().nonnegative().optional(),
  highEstimate: z.number().nonnegative().optional(),
  discountRate: z.number().min(0).max(1).optional(),
  expectedSettlementDate: z.string().optional(),
  narrative: z.string().optional(),
});

// --- Temporal Claim ---

export const createTemporalClaimSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  claimType: z.string().min(1),
  totalAmount: z.number().positive(),
  nodeRefId: z.string().uuid(),
  nodeRefType: z.string().min(1),
  economicCategory: z.string().min(1),
  counterNodeRefId: z.string().uuid(),
  counterNodeRefType: z.string().min(1),
  counterEconomicCategory: z.string().min(1),
  schedule: z.array(z.object({
    periodId: z.string().uuid(),
    amount: z.number().positive(),
  })).min(1),
  fundId: z.string().uuid().optional(),
  currency: z.string().length(3).optional(),
});

// --- Tax Engine schemas ---

export const computeDeferredTaxSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  taxRate: z.number(),
});

export const computeCurrentTaxSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  taxRate: z.number(),
  permanentDifferences: z.number().optional(),
});

export const createTaxProvisionSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  taxRate: z.number(),
  permanentDifferences: z.number().optional(),
  creditAmount: z.number().optional(),
});

export const postTaxProvisionSchema = z.object({
  journalEntryId: z.string().uuid(),
});

// --- Tax Module schemas ---

export const computeCRACorporateSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  activeBusinessIncome: z.number().optional(),
  smallBusinessLimit: z.number().optional(),
  gripBalance: z.number().optional(),
  lripBalance: z.number().optional(),
});

export const computeGSTHSTSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  gstRate: z.number().optional(),
  hstRate: z.number().optional(),
  salesAmount: z.number(),
  purchasesAmount: z.number(),
  isNFP: z.boolean().optional(),
});

export const computeIRSCorporateSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  section179Deduction: z.number().optional(),
});

export const computeCRACharitySchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  totalRevenue: z.number(),
  charitableExpenditures: z.number(),
  managementExpenses: z.number(),
});

export const computeIRSExemptSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  totalRevenue: z.number(),
  publicSupportRevenue: z.number(),
  unrelatedBusinessIncome: z.number().optional(),
});

export const computeStateTaxSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  stateCode: z.string().min(1),
  stateRate: z.number(),
  nexusEstablished: z.boolean(),
  apportionmentFactor: z.number().min(0).max(1).optional(),
});

export const computeWithholdingTaxSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  paymentType: z.enum(['DIVIDEND', 'INTEREST', 'ROYALTY', 'MANAGEMENT_FEE']),
  grossAmount: z.number(),
  treatyRate: z.number().optional(),
});

export const computeAllModulesSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
});

// --- Tax Credit schemas ---

export const identifyEligibleExpendituresSchema = z.object({
  entityId: z.string().uuid(),
  programCode: z.string().min(1),
  periodId: z.string().uuid(),
});

export const createTaxCreditClaimSchema = z.object({
  entityId: z.string().uuid(),
  programCode: z.string().min(1),
  periodId: z.string().uuid(),
  fiscalYear: z.string().min(1),
  eligibleExpenditureTotal: z.number(),
  eligibleNodeIds: z.array(z.string().uuid()),
  aiConfidence: z.number().optional(),
});

export const updateClaimStatusSchema = z.object({
  status: z.enum(['DRAFT', 'AI_IDENTIFIED', 'REVIEWED', 'APPROVED', 'FILED', 'ASSESSED', 'ADJUSTED', 'CLOSED']),
  assessedAmount: z.number().optional(),
});

export const updateCreditBalanceSchema = z.object({
  entityId: z.string().uuid(),
  programCode: z.string().min(1),
  balanceAsOf: z.string().min(1),
  creditsEarned: z.number(),
  creditsApplied: z.number().optional(),
  creditsExpired: z.number().optional(),
  creditsCarriedBack: z.number().optional(),
});

export const createReducesCostEdgeSchema = z.object({
  claimId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  costReductionAmount: z.number(),
  certainty: z.enum(['CLAIMED', 'ASSESSED', 'REALIZED']),
});

// --- Tax Credit AI schemas ---

export const createQualifiesForEdgeSchema = z.object({
  sourceNodeId: z.string().uuid(),
  claimId: z.string().uuid(),
  qualificationBasis: z.enum(['AI_INFERRED', 'MANUALLY_TAGGED', 'RULE_MATCHED']),
  eligibleAmount: z.number(),
  eligibilityConfidence: z.number(),
  expenditureCategory: z.enum(['SALARY', 'MATERIALS', 'SUBCONTRACTOR', 'OVERHEAD_PROXY', 'CAPITAL', 'OTHER']),
});

export const acceptQualificationSchema = z.object({
  sourceNodeId: z.string().uuid(),
  claimId: z.string().uuid(),
});

export const rejectQualificationSchema = z.object({
  sourceNodeId: z.string().uuid(),
  claimId: z.string().uuid(),
  rejectionReason: z.string().min(1),
});

const batchReviewItemSchema = z.object({
  sourceNodeId: z.string().uuid(),
  claimId: z.string().uuid(),
  accepted: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const batchReviewSchema = z.object({
  reviews: z.array(batchReviewItemSchema),
});

export const reidentifyWithRefinedModelSchema = z.object({
  entityId: z.string().uuid(),
  programCode: z.string().min(1),
  periodId: z.string().uuid(),
});

// --- GL: Statutory Mapping ---

export const createStatutoryMappingSchema = z.object({
  jurisdiction: z.string().min(1),
  nodeRefType: z.string().min(1),
  economicCategory: z.string().min(1),
  nodeTagsMatch: z.array(z.string()).optional(),
  statutoryAccountCode: z.string().min(1),
  statutoryAccountLabel: z.string().min(1),
  appliesFrom: z.string().min(1),
  appliesUntil: z.string().optional(),
  xbrlElement: z.string().optional(),
  xbrlTaxonomy: z.string().optional(),
});

// --- GL: Temporal Claim actions ---

export const recognizeClaimSchema = z.object({
  periodId: z.string().uuid(),
});

export const recognizeAllClaimsSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
});

export const autoReverseClaimsSchema = z.object({
  entityId: z.string().uuid(),
  currentPeriodId: z.string().uuid(),
  previousPeriodId: z.string().uuid(),
});

export const updateECLSchema = z.object({
  collectabilityScore: z.number().min(0).max(1),
  eclAllowance: z.number().nonnegative(),
});

// --- GL: Lease Accounting ---

export const createLeaseSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  leaseClassification: z.enum(['FINANCE', 'OPERATING']),
  totalLeasePayments: z.number().positive(),
  leaseTermMonths: z.number().positive(),
  monthlyPayment: z.number().positive(),
  incrementalBorrowingRate: z.number().positive(),
  commencementDate: z.string().min(1),
  leaseEndDate: z.string().min(1),
  periodSchedule: z.array(z.object({
    periodId: z.string().uuid(),
    paymentDate: z.string().min(1),
  })).min(1),
  activityRefId: z.string().uuid().optional(),
});

export const processLeasePaymentSchema = z.object({
  leaseLiabilityId: z.string().uuid(),
  rouAssetId: z.string().uuid(),
  periodId: z.string().uuid(),
});

// --- GL: Provision actions ---

export const provisionPeriodActionSchema = z.object({
  periodId: z.string().uuid(),
});

export const settleProvisionSchema = z.object({
  periodId: z.string().uuid(),
  actualAmount: z.number().nonnegative(),
});

// --- GL: Related Party ---

export const createRelatedPartySchema = z.object({
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  relationshipType: z.enum([
    'SHARED_BOARD', 'SHARED_MANAGEMENT', 'ECONOMIC_DEPENDENCE',
    'FAMILY', 'SIGNIFICANT_INFLUENCE',
  ]),
  individualsInCommon: z.array(z.string()),
  effectiveFrom: z.string().min(1),
  effectiveUntil: z.string().optional(),
  disclosureRequired: z.boolean().optional(),
});

export const createRelatedPartyTransactionSchema = z.object({
  sourceJournalEntryId: z.string().uuid(),
  targetJournalEntryId: z.string().uuid(),
  transactionNature: z.enum([
    'TRADE', 'SERVICE', 'DONATION', 'GRANT',
    'MANAGEMENT_FEE', 'SHARED_COST_ALLOCATION',
    'LICENSING', 'LOAN',
  ]),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  armsLengthValidated: z.boolean().optional(),
  armsLengthMethod: z.enum(['CUP', 'COST_PLUS', 'RESALE_MINUS', 'TNMM', 'PROFIT_SPLIT']).optional(),
  taxDeductibleForSource: z.boolean().optional(),
  donationReceiptIssued: z.boolean().optional(),
});

export const validateArmsLengthSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  method: z.enum(['CUP', 'COST_PLUS', 'RESALE_MINUS', 'TNMM', 'PROFIT_SPLIT']),
  tolerancePct: z.number().min(0).max(1).optional(),
});

// --- GL: Equity Close ---

export const computeRetainedEarningsSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  fundId: z.string().uuid().optional(),
  dividendsDeclared: z.number().nonnegative().optional(),
  otherAdjustments: z.number().optional(),
});

export const recordOCISchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  component: z.enum([
    'CTA_COMPONENT', 'CASHFLOW_HEDGE', 'NET_INVESTMENT_HEDGE',
    'FVOCI_DEBT', 'FVOCI_EQUITY', 'DB_PENSION', 'REVALUATION_SURPLUS',
  ]),
  currentPeriod: z.number(),
  sourceNodeId: z.string().uuid().optional(),
  sourceNodeType: z.enum(['CURRENCY_TRANSLATION', 'HEDGE', 'FINANCIAL_INSTRUMENT', 'PENSION']).optional(),
});

export const recycleOCISchema = z.object({
  amount: z.number(),
});

export const generateEquitySectionSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  nciEquity: z.number().optional(),
});

// --- Consolidation ---

export const createConsolidationGroupSchema = z.object({
  label: z.string().min(1),
  parentEntityId: z.string().uuid(),
  functionalCurrency: z.string().length(3),
  entityIds: z.array(z.string().uuid()).min(1),
  minorityInterestMethod: z.enum(['PROPORTIONATE', 'FULL_GOODWILL']),
  intercompanyThreshold: z.number().nonnegative().optional(),
});

export const createOwnershipInterestSchema = z.object({
  investorEntityId: z.string().uuid(),
  investeeEntityId: z.string().uuid(),
  ownershipPct: z.number().min(0).max(1),
  acquisitionCost: z.number().nonnegative(),
  netAssetsAtAcquisition: z.number(),
  acquisitionDate: z.string().min(1),
});

export const createIntercompanyMatchSchema = z.object({
  sourceLedgerLineId: z.string().uuid(),
  targetLedgerLineId: z.string().uuid(),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  eliminationAmount: z.number().nonnegative(),
  transactionType: z.enum(['SALE', 'LOAN', 'DIVIDEND', 'SERVICE', 'MANAGEMENT_FEE', 'RENTAL', 'GUARANTEE']),
  amountSellerCurrency: z.number().nonnegative(),
  amountBuyerCurrency: z.number().nonnegative(),
  unrealizedProfitPct: z.number().min(0).max(1).optional(),
});

export const createGoodwillSchema = z.object({
  acquireeEntityId: z.string().uuid(),
  grossAmount: z.number().positive(),
  currency: z.string().length(3),
  isFullGoodwill: z.boolean(),
  nciGoodwillPct: z.number().min(0).max(1).optional(),
  taxDeductible: z.boolean().optional(),
});

export const impairGoodwillSchema = z.object({
  impairmentLoss: z.number().positive(),
  testDate: z.string().min(1),
});

export const createCurrencyTranslationSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  functionalCurrency: z.string().length(3),
  presentationCurrency: z.string().length(3),
  averageRate: z.number().positive(),
  closingRate: z.number().positive(),
});

// --- Business Combinations ---

export const createBusinessCombinationSchema = z.object({
  label: z.string().min(1),
  acquirerEntityId: z.string().uuid(),
  acquireeEntityId: z.string().uuid(),
  acquisitionDate: z.string().min(1),
  totalConsideration: z.number().nonnegative(),
  considerationCash: z.number().nonnegative(),
  considerationShares: z.number().nonnegative(),
  considerationContingent: z.number().nonnegative(),
  fairValueNetAssets: z.number(),
  ownershipPctAcquired: z.number().min(0).max(1),
  nciFairValue: z.number().nonnegative().optional(),
  functionalCurrency: z.string().length(3),
  minorityInterestMethod: z.enum(['PROPORTIONATE', 'FULL_GOODWILL']).optional(),
});

export const createPPASchema = z.object({
  businessCombinationId: z.string().uuid(),
  targetNodeId: z.string().uuid(),
  targetNodeType: z.enum(['FIXED_ASSET', 'INVENTORY_ITEM', 'TEMPORAL_CLAIM', 'RIGHT_OF_USE_ASSET', 'GOODWILL']),
  bookValueAtAcquisition: z.number(),
  fairValueAtAcquisition: z.number(),
  intangibleCategory: z.enum(['CUSTOMER_LIST', 'TECHNOLOGY', 'BRAND', 'NONCOMPETE', 'CONTRACT_BACKLOG', 'IN_PROCESS_RD', 'NONE']),
  usefulLifeYears: z.number().positive().optional(),
  amortizationMethod: z.enum(['STRAIGHT_LINE', 'ACCELERATED']).optional(),
  taxBasisAdjustment: z.number().optional(),
  provisional: z.boolean().optional(),
});

export const amortizePPASchema = z.object({
  periodCharge: z.number().positive(),
});

export const createCGUSchema = z.object({
  label: z.string().min(1),
  entityIds: z.array(z.string().uuid()).min(1),
  goodwillIds: z.array(z.string().uuid()).optional(),
  viuDiscountRate: z.number().min(0).max(1),
  viuHorizonYears: z.number().int().min(1).max(50),
  viuTerminalGrowthRate: z.number().min(0).max(1),
});

export const createImpairmentTestSchema = z.object({
  goodwillId: z.string().uuid(),
  cguId: z.string().uuid(),
  periodId: z.string().uuid(),
  testDate: z.string().min(1),
  fvlcod: z.number().nonnegative().optional(),
  approvedBy: z.string().uuid().optional(),
});

// --- Depreciation ---

export const createFixedAssetSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  costAtAcquisition: z.number().positive(),
  acquisitionDate: z.string().min(1),
  activityRefId: z.string().uuid(),
  depreciationMethod: z.enum([
    'STRAIGHT_LINE', 'DECLINING_BALANCE', 'DOUBLE_DECLINING',
    'UNITS_OF_PRODUCTION', 'SUM_OF_YEARS', 'GDS_TABLE', 'ADS_TABLE',
  ]).optional(),
  usefulLifeYears: z.number().positive().optional(),
  salvageValue: z.number().nonnegative().optional(),
  cguId: z.string().uuid().optional(),
});

export const disposeFixedAssetSchema = z.object({
  disposalDate: z.string().min(1),
  proceedsAmount: z.number().nonnegative(),
});

export const createBelongsToSchema = z.object({
  assetClassId: z.string().uuid(),
  classSystem: z.enum(['CCA', 'MACRS', 'ACCOUNTING']),
  overrideRatePct: z.number().min(0).max(1).optional(),
  overrideUsefulLife: z.number().positive().optional(),
  overrideSalvageValue: z.number().nonnegative().optional(),
  overrideReason: z.string().optional(),
  effectiveFrom: z.string().min(1),
});

export const createUCCPoolSchema = z.object({
  entityId: z.string().uuid(),
  assetClassId: z.string().uuid(),
  fiscalYear: z.string().min(1),
  openingUcc: z.number().nonnegative(),
});

export const calculateCCASchema = z.object({
  claimAmount: z.number().nonnegative().optional(),
});

export const depreciateAssetSchema = z.object({
  periodId: z.string().uuid(),
});

export const depreciateAllAssetsSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
});

// --- Cashflow ---

export const createCashFlowEventSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  direction: z.enum(['INFLOW', 'OUTFLOW']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  scheduledDate: z.string().min(1),
  earliestDate: z.string().optional(),
  latestDate: z.string().optional(),
  discountOfferedPct: z.number().min(0).max(1).optional(),
  penaltyRateDaily: z.number().nonnegative().optional(),
  counterpartyId: z.string().uuid().optional(),
  relationshipSensitivity: z.number().min(0).max(1).optional(),
  status: z.enum(['PENDING', 'SETTLED', 'CANCELLED']).optional(),
});

export const createCreditFacilitySchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  facilityType: z.enum(['REVOLVER', 'LINE_OF_CREDIT', 'TERM_LOAN']),
  limit: z.number().positive(),
  drawn: z.number().nonnegative().optional(),
  interestRate: z.number().nonnegative(),
  rateType: z.enum(['FIXED', 'VARIABLE']),
  maturityDate: z.string().min(1),
});

// --- Hedge Accounting schemas ---

export const createFinancialInstrumentSchema = z.object({
  entityId: z.string().uuid(),
  instrumentType: z.enum(['CASH', 'RECEIVABLE', 'PAYABLE', 'LOAN', 'BOND', 'EQUITY_INVESTMENT', 'DERIVATIVE', 'HEDGE_INSTRUMENT']),
  ifrs9Classification: z.enum(['AMORTISED_COST', 'FVOCI_DEBT', 'FVOCI_EQUITY', 'FVTPL']),
  label: z.string().min(1),
  hostNodeId: z.string().uuid().optional(),
  fairValue: z.number().optional(),
  fairValueHierarchy: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']).optional(),
  amortisedCost: z.number().optional(),
  effectiveInterestRate: z.number().optional(),
  eclStage: z.enum(['STAGE_1', 'STAGE_2', 'STAGE_3']).optional(),
  grossCarryingAmount: z.number(),
});

export const updateFairValueSchema = z.object({
  fairValue: z.number(),
});

export const createHedgeRelationshipSchema = z.object({
  entityId: z.string().uuid(),
  hedgeType: z.enum(['FAIR_VALUE', 'CASH_FLOW', 'NET_INVESTMENT']),
  hedgingInstrumentId: z.string().uuid(),
  hedgedItemId: z.string().uuid(),
  designationDate: z.string().min(1),
  hedgeRatio: z.number(),
  effectivenessMethod: z.string().min(1),
});

export const retrospectiveTestSchema = z.object({
  hedgingInstrumentChange: z.number(),
  hedgedItemChange: z.number(),
});

export const hedgeProcessSchema = z.object({
  instrumentFVChange: z.number(),
  hedgedItemFVChange: z.number(),
});

export const netInvestmentHedgeProcessSchema = z.object({
  instrumentFVChange: z.number(),
  netInvestmentChange: z.number(),
});

// --- Bank Reconciliation schemas ---

export const createBankStatementSchema = z.object({
  entityId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  statementDate: z.string().min(1),
  openingBalance: z.number(),
  closingBalance: z.number(),
  currency: z.string().length(3),
});

export const createBankStatementLineSchema = z.object({
  entityId: z.string().uuid(),
  statementId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  transactionDate: z.string().min(1),
  amount: z.number(),
  description: z.string().min(1),
  reference: z.string().optional(),
});

const bulkLineSchema = z.object({
  transactionDate: z.string().min(1),
  amount: z.number(),
  description: z.string().min(1),
  reference: z.string().optional(),
});

export const importStatementLinesSchema = z.object({
  entityId: z.string().uuid(),
  statementId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  lines: z.array(bulkLineSchema).min(1),
});

export const matchLineToEventSchema = z.object({
  lineId: z.string().uuid(),
  cashFlowEventId: z.string().uuid(),
});

export const autoMatchSchema = z.object({
  dateTolerance: z.number().optional(),
});

// --- Equity Expansion schemas ---

export const createShareClassSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  shareClassType: z.enum(['COMMON', 'PREFERRED', 'CLASS_A', 'CLASS_B']),
  parValue: z.number(),
  authorizedShares: z.number(),
  issuedShares: z.number().optional(),
  currency: z.string().length(3),
  isVoting: z.boolean().optional(),
  dividendRate: z.number().optional(),
  isCumulativeDividend: z.boolean().optional(),
  liquidationPreference: z.number().optional(),
  conversionRatio: z.number().optional(),
  isParticipating: z.boolean().optional(),
});

export const issueSharesSchema = z.object({
  additionalShares: z.number().positive(),
  pricePerShare: z.number().positive(),
});

export const createEquityAwardSchema = z.object({
  entityId: z.string().uuid(),
  shareClassId: z.string().uuid(),
  label: z.string().min(1),
  awardType: z.enum(['STOCK_OPTION', 'RSU', 'PERFORMANCE_SHARE', 'PHANTOM_STOCK', 'SAR']),
  grantDate: z.string().min(1),
  vestingType: z.enum(['TIME_BASED', 'PERFORMANCE_BASED', 'CLIFF', 'GRADED']),
  vestingPeriodMonths: z.number().positive(),
  cliffMonths: z.number().optional(),
  sharesGranted: z.number().positive(),
  exercisePrice: z.number().optional(),
  fairValueAtGrant: z.number().positive(),
  expiryDate: z.string().optional(),
});

export const recognizeVestingSchema = z.object({
  periodId: z.string().uuid(),
  monthsElapsed: z.number().nonnegative(),
  validDate: z.string().min(1),
  currency: z.string().length(3),
});

export const computeEPSSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  netIncome: z.number(),
});

// --- Inventory schemas ---

export const createInventoryItemSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  sku: z.string().min(1),
  category: z.enum(['RAW_MATERIAL', 'WORK_IN_PROGRESS', 'FINISHED_GOODS', 'MERCHANDISE']),
  unitOfMeasure: z.string().min(1),
  costMethod: z.enum(['FIFO', 'WEIGHTED_AVG', 'LIFO']),
  currency: z.string().length(3),
  reorderPoint: z.number().optional(),
});

export const createInventoryLotSchema = z.object({
  entityId: z.string().uuid(),
  itemId: z.string().uuid(),
  lotNumber: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  acquisitionDate: z.string().min(1),
});

export const receiveInventorySchema = z.object({
  entityId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  acquisitionDate: z.string().min(1),
  periodId: z.string().uuid(),
  currency: z.string().length(3),
});

export const issueInventorySchema = z.object({
  entityId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  periodId: z.string().uuid(),
  validDate: z.string().min(1),
  currency: z.string().length(3),
});

export const nrvTestSchema = z.object({
  itemId: z.string().uuid(),
  nrvPerUnit: z.number(),
  periodId: z.string().uuid(),
  validDate: z.string().min(1),
  currency: z.string().length(3),
});

// --- Revenue Recognition schemas ---

export const createRevenueContractSchema = z.object({
  entityId: z.string().uuid(),
  label: z.string().min(1),
  customerName: z.string().min(1),
  customerId: z.string().uuid().optional(),
  inceptionDate: z.string().min(1),
  transactionPrice: z.number().positive(),
  currency: z.string().length(3),
  periodId: z.string().uuid(),
});

export const createPerformanceObligationSchema = z.object({
  entityId: z.string().uuid(),
  contractId: z.string().uuid(),
  label: z.string().min(1),
  standaloneSellingPrice: z.number().positive(),
  satisfactionMethod: z.enum(['POINT_IN_TIME', 'OVER_TIME']),
  overTimeMeasure: z.enum(['INPUT', 'OUTPUT', 'STRAIGHT_LINE']).optional(),
  isDistinct: z.boolean().optional(),
});

export const createVariableConsiderationSchema = z.object({
  entityId: z.string().uuid(),
  contractId: z.string().uuid(),
  considerationType: z.enum(['DISCOUNT', 'REBATE', 'PENALTY', 'BONUS', 'PRICE_CONCESSION', 'RIGHT_OF_RETURN']),
  estimateMethod: z.enum(['EXPECTED_VALUE', 'MOST_LIKELY_AMOUNT']),
  estimatedAmount: z.number(),
  isConstrained: z.boolean().optional(),
  constraintReason: z.string().optional(),
});

export const resolveVariableConsiderationSchema = z.object({
  resolvedAmount: z.number(),
});

export const recognizePointInTimeSchema = z.object({
  poId: z.string().uuid(),
  periodId: z.string().uuid(),
  satisfiedDate: z.string().min(1),
});

export const recognizeOverTimeSchema = z.object({
  poId: z.string().uuid(),
  periodId: z.string().uuid(),
  progressPct: z.number().min(0).max(100),
  validDate: z.string().min(1),
});

// --- Compliance schemas ---

export const createApprovalWorkflowSchema = z.object({
  entityId: z.string().uuid(),
  approvalType: z.enum(['JOURNAL_ENTRY', 'TAX_PROVISION', 'PERIOD_CLOSE', 'CREDIT_CLAIM', 'GENERAL']),
  targetNodeId: z.string().uuid(),
  targetNodeType: z.string().min(1),
  requestedBy: z.string().min(1),
  requiredApprovers: z.array(z.string().min(1)).min(1),
  thresholdAmount: z.number().optional(),
  description: z.string().optional(),
});

export const approveWorkflowSchema = z.object({
  approverId: z.string().min(1),
});

export const rejectWorkflowSchema = z.object({
  rejectedBy: z.string().min(1),
  reason: z.string().min(1),
});

export const createSourceDocumentSchema = z.object({
  entityId: z.string().uuid(),
  documentType: z.string().min(1),
  filename: z.string().min(1),
  content: z.string().min(1),
  uploadedBy: z.string().min(1),
  linkedNodeId: z.string().uuid().optional(),
  linkedNodeType: z.string().optional(),
});

export const verifyDocumentSchema = z.object({
  content: z.string().min(1),
});

export const logAccessSchema = z.object({
  entityId: z.string().uuid(),
  userId: z.string().min(1),
  action: z.enum(['READ', 'WRITE', 'DELETE', 'EXPORT']),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  sensitivityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  ipAddress: z.string().optional(),
  details: z.string().optional(),
});

// --- AI schemas ---

export const recordRealizationSchema = z.object({
  outcomeId: z.string().uuid(),
  realizedDelta: z.number(),
  periodId: z.string().uuid(),
});

export const valueStateTransitionSchema = z.object({
  nodeId: z.string().uuid(),
  newState: z.enum(['FORECASTED', 'ESTIMATED', 'VALIDATED', 'REALIZED', 'STALE_ESTIMATED']),
  epistemicActivityId: z.string().uuid().optional(),
});

const scenarioInputSchema = z.object({
  label: z.string().min(1),
  probability: z.number().min(0).max(1),
  impactMultiplier: z.number(),
  description: z.string().optional(),
});

export const createScenarioSetSchema = z.object({
  nodeId: z.string().uuid(),
  label: z.string().min(1),
  scenarios: z.array(scenarioInputSchema).min(1),
  baseValue: z.number(),
});

export const runMonteCarloSchema = z.object({
  simulations: z.number().positive().optional(),
});

export const fireScenarioSchema = z.object({
  scenarioSetId: z.string().uuid(),
  scenarioLabel: z.string().min(1),
  actualImpact: z.number(),
});

export const epistemicROISchema = z.object({
  nodeId: z.string().uuid(),
  activityCost: z.number(),
});

export const aiQuerySchema = z.object({
  query: z.string().min(1),
  entityId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  outcomeId: z.string().uuid().optional(),
});

export const generateEmbeddingSchema = z.object({
  nodeId: z.string().uuid(),
  entityId: z.string().uuid(),
  nodeLabel: z.string().min(1),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export const discoverEdgeCandidatesSchema = z.object({
  threshold: z.number().optional(),
  limit: z.number().optional(),
});

export const createInferredEdgesSchema = z.object({
  candidates: z.array(z.object({
    nodeId: z.string().uuid(),
    similarNodeId: z.string().uuid(),
    similarity: z.number(),
  })).min(1),
  entityId: z.string().uuid(),
});

export const edgeDiscoveryPipelineSchema = z.object({
  threshold: z.number().optional(),
  limit: z.number().optional(),
  autoCreate: z.boolean().optional(),
});

// --- COA Migration schemas ---

const coaMappingSchema = z.object({
  coaCode: z.string().min(1),
  coaLabel: z.string().min(1),
  nodeRefId: z.string().uuid(),
  nodeRefType: z.enum([
    'ACTIVITY', 'PROJECT', 'INITIATIVE', 'OUTCOME',
    'CASHFLOWEVENT', 'TEMPORAL_CLAIM', 'FIXED_ASSET',
    'GOODWILL', 'PROVISION', 'WORKFORCE_ASSET',
    'CUSTOMER_RELATIONSHIP_ASSET', 'FUND', 'TAX_CREDIT_CLAIM', 'OCI',
    'RIGHT_OF_USE_ASSET', 'LEASE_LIABILITY',
    'REVENUE_CONTRACT', 'PERFORMANCE_OBLIGATION',
    'INVENTORY_ITEM',
  ]),
  economicCategory: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  jurisdiction: z.string().optional(),
});

export const registerCOAMappingSchema = z.union([
  coaMappingSchema,
  z.array(coaMappingSchema).min(1),
]);

const legacyGLLineSchema = z.object({
  coaCode: z.string().min(1),
  side: z.enum(['DEBIT', 'CREDIT']),
  amount: z.number().positive(),
  fundId: z.string().uuid().optional(),
});

const legacyGLEntrySchema = z.object({
  legacyId: z.string().min(1),
  entryDate: z.string().min(1),
  narrative: z.string().min(1),
  sourceSystem: z.string().min(1),
  lines: z.array(legacyGLLineSchema).min(1),
});

export const validateImportSchema = z.object({
  entries: z.array(legacyGLEntrySchema).optional(),
});

export const importLegacyGLSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  entries: z.array(legacyGLEntrySchema).min(1),
  currency: z.string().length(3).optional(),
});

export const createNodesForUnmappedCodesSchema = z.object({
  entityId: z.string().uuid(),
  unmappedCodes: z.array(z.object({
    coaCode: z.string().min(1),
    coaLabel: z.string().min(1),
    economicCategory: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  })).min(1),
});

export const seedStatutorySchema = z.object({
  jurisdiction: z.string().min(1),
  asOfDate: z.string().min(1),
});

export const verifyTrialBalanceSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  trialBalance: z.array(z.object({
    coaCode: z.string().min(1),
    coaLabel: z.string().min(1),
    debitBalance: z.number(),
    creditBalance: z.number(),
  })).min(1),
});
