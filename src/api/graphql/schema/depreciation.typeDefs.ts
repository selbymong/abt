// GraphQL type definitions for Depreciation domain
// FixedAsset, AssetClass, UCCPool, DepreciationSchedule, and engine operations

export const depreciationTypeDefs = `
  type FixedAsset {
    id: ID!
    entity_id: String!
    label: String!
    cost_at_acquisition: Float!
    accumulated_depreciation: Float!
    accumulated_impairment: Float!
    carrying_amount: Float!
    depreciation_method: DepreciationMethod
    useful_life_years: Float
    salvage_value: Float
    acquisition_date: String!
    disposal_date: String
    cgu_id: String
    tax_base: Float!
    tax_accumulated_dep: Float!
    activity_ref_id: String!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type AssetClass {
    id: ID!
    class_code: String!
    label: String!
    class_system: ClassSystem!
    jurisdiction: String!
    depreciation_method: DepreciationMethod!
    rate_pct: Float
    useful_life_years: Float
    salvage_value_pct: Float!
    first_year_rule: FirstYearRule!
    pool_method: PoolMethod!
    disposal_rule: DisposalRule!
    accelerated_incentive_rate: Float
    accelerated_incentive_expiry: String
    eligible_entity_types: [String!]!
    asset_examples: [String!]!
    legislation_reference: String!
    effective_from: String!
    effective_until: String
    created_at: DateTime!
    updated_at: DateTime!
  }

  type AssetClassMapping {
    classSystem: String!
    assetClass: AssetClass!
    overrides: JSON
  }

  type UCCPool {
    id: ID!
    entity_id: String!
    asset_class_id: String!
    fiscal_year: String!
    opening_ucc: Float!
    additions: Float!
    disposals_proceeds: Float!
    adjustments: Float!
    base_for_cca: Float!
    cca_claimed: Float!
    cca_maximum: Float!
    closing_ucc: Float!
    recapture: Float!
    terminal_loss: Float!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type DepreciationScheduleEntry {
    period_id: String!
    charge: Float!
    accumulated: Float!
    carrying_remaining: Float!
  }

  type DepreciationSchedule {
    id: ID!
    fixed_asset_id: String!
    schedule: [DepreciationScheduleEntry!]!
    last_charge_period_id: String
    revision_history: JSON
    created_at: DateTime!
    updated_at: DateTime!
  }

  type DepreciationResult {
    accountingCharge: Float!
    taxCharge: Float!
    temporaryDifference: Float!
    journalEntryId: String
  }

  type DepreciateAllResult {
    assetCount: Int!
    totalAccountingCharge: Float!
    totalTaxCharge: Float!
    journalEntryIds: [String!]!
  }

  type DisposalResult {
    gainLoss: Float!
  }

  type CCAResult {
    ccaMaximum: Float!
    ccaClaimed: Float!
    closingUcc: Float!
    recapture: Float!
    terminalLoss: Float!
  }

  input CreateFixedAssetInput {
    entityId: String!
    label: String!
    costAtAcquisition: Float!
    acquisitionDate: String!
    activityRefId: String!
    depreciationMethod: DepreciationMethod
    usefulLifeYears: Float
    salvageValue: Float
    cguId: String
  }

  input UpdateFixedAssetInput {
    label: String
    depreciationMethod: DepreciationMethod
    usefulLifeYears: Float
    salvageValue: Float
    cguId: String
  }

  input CreateBelongsToInput {
    fixedAssetId: String!
    assetClassId: String!
    classSystem: ClassSystem!
    overrideRatePct: Float
    overrideUsefulLife: Float
    overrideSalvageValue: Float
    overrideReason: String
    effectiveFrom: String!
  }

  input CreateUCCPoolInput {
    entityId: String!
    assetClassId: String!
    fiscalYear: String!
    openingUcc: Float!
  }

  extend type Query {
    fixedAsset(id: ID!): FixedAsset
    fixedAssets(entityId: String!): [FixedAsset!]!
    assetClasses(classSystem: ClassSystem, jurisdiction: String): [AssetClass!]!
    assetClass(code: String!): AssetClass
    assetClassesForAsset(assetId: ID!): [AssetClassMapping!]!
    uccPool(id: ID!): UCCPool
    uccPoolForClass(entityId: String!, assetClassId: String!, fiscalYear: String!): UCCPool
    depreciationSchedule(fixedAssetId: ID!): DepreciationSchedule
  }

  extend type Mutation {
    createFixedAsset(input: CreateFixedAssetInput!): ID!
    updateFixedAsset(id: ID!, input: UpdateFixedAssetInput!): Boolean!
    disposeFixedAsset(id: ID!, disposalDate: String!, proceedsAmount: Float!): DisposalResult!
    createBelongsToEdge(input: CreateBelongsToInput!): Boolean!
    createUCCPool(input: CreateUCCPoolInput!): ID!
    calculateCCA(poolId: ID!, claimAmount: Float): CCAResult!
    depreciateAsset(fixedAssetId: ID!, periodId: String!, postJE: Boolean): DepreciationResult!
    depreciateAllAssets(entityId: String!, periodId: String!): DepreciateAllResult!
  }
`;
