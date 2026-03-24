// ============================================================
// 01-constraints-indexes.cypher
// Enterprise Business Graph — Base constraints and indexes
// Phase 0: Run FIRST before any other cypher files
// ============================================================

// --- Entity ---
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.id IS UNIQUE;

CREATE INDEX entity_type_idx IF NOT EXISTS
FOR (e:Entity) ON (e.entity_type);

CREATE INDEX entity_jurisdiction_idx IF NOT EXISTS
FOR (e:Entity) ON (e.jurisdiction);

// --- Resource ---
CREATE CONSTRAINT resource_id_unique IF NOT EXISTS
FOR (r:Resource) REQUIRE r.id IS UNIQUE;

CREATE INDEX resource_entity_idx IF NOT EXISTS
FOR (r:Resource) ON (r.entity_id);

CREATE INDEX resource_type_idx IF NOT EXISTS
FOR (r:Resource) ON (r.resource_type);

// --- Activity ---
CREATE CONSTRAINT activity_id_unique IF NOT EXISTS
FOR (a:Activity) REQUIRE a.id IS UNIQUE;

CREATE INDEX activity_entity_idx IF NOT EXISTS
FOR (a:Activity) ON (a.entity_id);

CREATE INDEX activity_status_idx IF NOT EXISTS
FOR (a:Activity) ON (a.status);

CREATE INDEX activity_project_idx IF NOT EXISTS
FOR (a:Activity) ON (a.project_id);

// --- Project ---
CREATE CONSTRAINT project_id_unique IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE INDEX project_entity_idx IF NOT EXISTS
FOR (p:Project) ON (p.entity_id);

CREATE INDEX project_status_idx IF NOT EXISTS
FOR (p:Project) ON (p.status);

// --- Initiative ---
CREATE CONSTRAINT initiative_id_unique IF NOT EXISTS
FOR (i:Initiative) REQUIRE i.id IS UNIQUE;

CREATE INDEX initiative_entity_idx IF NOT EXISTS
FOR (i:Initiative) ON (i.entity_id);

// --- Metric ---
CREATE CONSTRAINT metric_id_unique IF NOT EXISTS
FOR (m:Metric) REQUIRE m.id IS UNIQUE;

CREATE INDEX metric_entity_idx IF NOT EXISTS
FOR (m:Metric) ON (m.entity_id);

CREATE INDEX metric_type_idx IF NOT EXISTS
FOR (m:Metric) ON (m.metric_type);

// --- Capability ---
CREATE CONSTRAINT capability_id_unique IF NOT EXISTS
FOR (c:Capability) REQUIRE c.id IS UNIQUE;

CREATE INDEX capability_entity_idx IF NOT EXISTS
FOR (c:Capability) ON (c.entity_id);

// --- Asset ---
CREATE CONSTRAINT asset_id_unique IF NOT EXISTS
FOR (a:Asset) REQUIRE a.id IS UNIQUE;

CREATE INDEX asset_entity_idx IF NOT EXISTS
FOR (a:Asset) ON (a.entity_id);

CREATE INDEX asset_type_idx IF NOT EXISTS
FOR (a:Asset) ON (a.asset_type);

// --- Outcome ---
CREATE CONSTRAINT outcome_id_unique IF NOT EXISTS
FOR (o:Outcome) REQUIRE o.id IS UNIQUE;

CREATE INDEX outcome_entity_idx IF NOT EXISTS
FOR (o:Outcome) ON (o.entity_id);

CREATE INDEX outcome_ontology_idx IF NOT EXISTS
FOR (o:Outcome) ON (o.ontology);

CREATE INDEX outcome_type_idx IF NOT EXISTS
FOR (o:Outcome) ON (o.outcome_type);

// --- CustomerRelationshipAsset ---
CREATE CONSTRAINT cra_id_unique IF NOT EXISTS
FOR (c:CustomerRelationshipAsset) REQUIRE c.id IS UNIQUE;

CREATE INDEX cra_entity_idx IF NOT EXISTS
FOR (c:CustomerRelationshipAsset) ON (c.entity_id);

// --- WorkforceAsset ---
CREATE CONSTRAINT wa_id_unique IF NOT EXISTS
FOR (w:WorkforceAsset) REQUIRE w.id IS UNIQUE;

CREATE INDEX wa_entity_idx IF NOT EXISTS
FOR (w:WorkforceAsset) ON (w.entity_id);

// --- SocialConstraint ---
CREATE CONSTRAINT sc_id_unique IF NOT EXISTS
FOR (s:SocialConstraint) REQUIRE s.id IS UNIQUE;

CREATE INDEX sc_entity_idx IF NOT EXISTS
FOR (s:SocialConstraint) ON (s.entity_id);

// --- StakeholderAsset ---
CREATE CONSTRAINT sa_id_unique IF NOT EXISTS
FOR (s:StakeholderAsset) REQUIRE s.id IS UNIQUE;

CREATE INDEX sa_entity_idx IF NOT EXISTS
FOR (s:StakeholderAsset) ON (s.entity_id);

// --- Obligation ---
CREATE CONSTRAINT obligation_id_unique IF NOT EXISTS
FOR (o:Obligation) REQUIRE o.id IS UNIQUE;

CREATE INDEX obligation_entity_idx IF NOT EXISTS
FOR (o:Obligation) ON (o.entity_id);

CREATE INDEX obligation_status_idx IF NOT EXISTS
FOR (o:Obligation) ON (o.status);

CREATE INDEX obligation_due_idx IF NOT EXISTS
FOR (o:Obligation) ON (o.due_date);

// --- EpistemicActivity ---
CREATE CONSTRAINT ea_id_unique IF NOT EXISTS
FOR (e:EpistemicActivity) REQUIRE e.id IS UNIQUE;

CREATE INDEX ea_entity_idx IF NOT EXISTS
FOR (e:EpistemicActivity) ON (e.entity_id);

CREATE INDEX ea_status_idx IF NOT EXISTS
FOR (e:EpistemicActivity) ON (e.status);

// --- CashFlowEvent ---
CREATE CONSTRAINT cfe_id_unique IF NOT EXISTS
FOR (c:CashFlowEvent) REQUIRE c.id IS UNIQUE;

CREATE INDEX cfe_entity_idx IF NOT EXISTS
FOR (c:CashFlowEvent) ON (c.entity_id);

CREATE INDEX cfe_status_idx IF NOT EXISTS
FOR (c:CashFlowEvent) ON (c.status);

CREATE INDEX cfe_scheduled_idx IF NOT EXISTS
FOR (c:CashFlowEvent) ON (c.scheduled_date);

// --- FloatWindow ---
CREATE CONSTRAINT fw_id_unique IF NOT EXISTS
FOR (f:FloatWindow) REQUIRE f.id IS UNIQUE;

// --- PaymentTerm ---
CREATE CONSTRAINT pt_id_unique IF NOT EXISTS
FOR (p:PaymentTerm) REQUIRE p.id IS UNIQUE;

// --- CreditFacility ---
CREATE CONSTRAINT cf_id_unique IF NOT EXISTS
FOR (c:CreditFacility) REQUIRE c.id IS UNIQUE;

CREATE INDEX cf_entity_idx IF NOT EXISTS
FOR (c:CreditFacility) ON (c.entity_id);

// --- FinancialInstrument ---
CREATE CONSTRAINT fi_id_unique IF NOT EXISTS
FOR (f:FinancialInstrument) REQUIRE f.id IS UNIQUE;

CREATE INDEX fi_entity_idx IF NOT EXISTS
FOR (f:FinancialInstrument) ON (f.entity_id);

CREATE INDEX fi_classification_idx IF NOT EXISTS
FOR (f:FinancialInstrument) ON (f.ifrs9_classification);

// --- HedgeRelationship ---
CREATE CONSTRAINT hr_id_unique IF NOT EXISTS
FOR (h:HedgeRelationship) REQUIRE h.id IS UNIQUE;

CREATE INDEX hr_entity_idx IF NOT EXISTS
FOR (h:HedgeRelationship) ON (h.entity_id);
