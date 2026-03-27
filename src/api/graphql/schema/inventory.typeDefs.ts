export const inventoryTypeDefs = `
  type InventoryItem {
    id: ID!
    entity_id: String!
    label: String!
    sku: String!
    category: InventoryCategory!
    unit_of_measure: String!
    quantity_on_hand: Float!
    unit_cost: Float!
    total_cost: Float!
    nrv_per_unit: Float
    nrv_total: Float
    nrv_writedown: Float!
    carrying_amount: Float!
    cost_method: InventoryCostMethod!
    currency: String!
    reorder_point: Float
    is_active: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type InventoryLot {
    id: ID!
    entity_id: String!
    item_id: String!
    lot_number: String!
    quantity: Float!
    unit_cost: Float!
    total_cost: Float!
    acquisition_date: String!
    remaining_quantity: Float!
    is_depleted: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type InventoryValuation {
    items: [InventoryItem!]!
    totalCost: Float!
    totalNRVWritedown: Float!
    totalCarryingAmount: Float!
    itemCount: Int!
  }

  type ReceiveInventoryResult {
    lotId: String!
    journalEntryId: String!
  }

  type LotConsumed {
    lotId: String!
    quantity: Float!
    unitCost: Float!
  }

  type IssueInventoryResult {
    cogsAmount: Float!
    journalEntryId: String!
    lotsConsumed: [LotConsumed!]!
  }

  type NRVTestResult {
    writedownAmount: Float!
    journalEntryId: String
    previousWritedown: Float!
    newCarryingAmount: Float!
  }

  input CreateInventoryItemInput {
    entityId: String!
    label: String!
    sku: String!
    category: InventoryCategory!
    unitOfMeasure: String!
    costMethod: InventoryCostMethod!
    currency: String!
    reorderPoint: Float
  }

  input CreateInventoryLotInput {
    entityId: String!
    itemId: String!
    lotNumber: String!
    quantity: Float!
    unitCost: Float!
    acquisitionDate: String!
  }

  input ReceiveInventoryInput {
    entityId: String!
    itemId: String!
    quantity: Float!
    unitCost: Float!
    acquisitionDate: String!
    periodId: String!
    currency: String!
  }

  input IssueInventoryInput {
    entityId: String!
    itemId: String!
    quantity: Float!
    periodId: String!
    validDate: String!
    currency: String!
  }

  input NRVTestInput {
    itemId: String!
    nrvPerUnit: Float!
    periodId: String!
    validDate: String!
    currency: String!
  }

  extend type Query {
    inventoryItem(id: ID!): InventoryItem
    inventoryItems(entityId: String!, category: InventoryCategory): [InventoryItem!]!
    inventoryLot(id: ID!): InventoryLot
    inventoryLots(itemId: String!): [InventoryLot!]!
    inventoryValuation(entityId: String!): InventoryValuation!
  }

  extend type Mutation {
    createInventoryItem(input: CreateInventoryItemInput!): ID!
    createInventoryLot(input: CreateInventoryLotInput!): ID!
    receiveInventory(input: ReceiveInventoryInput!): ReceiveInventoryResult!
    issueInventory(input: IssueInventoryInput!): IssueInventoryResult!
    testNRV(input: NRVTestInput!): NRVTestResult!
  }
`;
