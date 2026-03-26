import { Router, Request, Response } from 'express';
import {
  createApprovalWorkflow,
  getApprovalWorkflow,
  listPendingApprovals,
  approveWorkflow,
  rejectWorkflow,
  isApproved,
  createSourceDocument,
  getSourceDocument,
  listSourceDocuments,
  verifyDocument,
  logAccess,
  getAccessLogs,
  getHighSensitivityAccess,
  generateRelatedPartyDisclosures,
} from '../../services/compliance/compliance-service.js';

export const complianceRouter = Router();

// --- Approval Workflow ---

complianceRouter.post('/approvals', async (req: Request, res: Response) => {
  try {
    const id = await createApprovalWorkflow(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.get('/approvals/:id', async (req: Request, res: Response) => {
  try {
    const wf = await getApprovalWorkflow(req.params.id as string);
    if (!wf) return res.status(404).json({ error: 'ApprovalWorkflow not found' });
    res.json(wf);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.get('/approvals/pending/:entityId', async (req: Request, res: Response) => {
  try {
    const approver = req.query.approver as string | undefined;
    const pending = await listPendingApprovals(req.params.entityId as string, approver);
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.post('/approvals/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approverId } = req.body;
    if (!approverId) return res.status(400).json({ error: 'approverId required' });
    const result = await approveWorkflow(req.params.id as string, approverId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

complianceRouter.post('/approvals/:id/reject', async (req: Request, res: Response) => {
  try {
    const { rejectedBy, reason } = req.body;
    if (!rejectedBy || !reason) return res.status(400).json({ error: 'rejectedBy and reason required' });
    const result = await rejectWorkflow(req.params.id as string, rejectedBy, reason);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

complianceRouter.get('/approvals/check/:nodeId', async (req: Request, res: Response) => {
  try {
    const approved = await isApproved(req.params.nodeId as string);
    res.json({ approved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Source Documents ---

complianceRouter.post('/documents', async (req: Request, res: Response) => {
  try {
    const id = await createSourceDocument(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const doc = await getSourceDocument(req.params.id as string);
    if (!doc) return res.status(404).json({ error: 'SourceDocument not found' });
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.get('/documents/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const linkedNodeId = req.query.linkedNodeId as string | undefined;
    const docs = await listSourceDocuments(req.params.entityId as string, linkedNodeId);
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.post('/documents/:id/verify', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const result = await verifyDocument(req.params.id as string, content);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Access Audit ---

complianceRouter.post('/audit/log', async (req: Request, res: Response) => {
  try {
    const id = await logAccess(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.get('/audit/logs/:entityId', async (req: Request, res: Response) => {
  try {
    const logs = await getAccessLogs(req.params.entityId as string, {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      sensitivityLevel: req.query.sensitivityLevel as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

complianceRouter.get('/audit/high-sensitivity/:entityId', async (req: Request, res: Response) => {
  try {
    const fromDate = req.query.fromDate as string | undefined;
    const logs = await getHighSensitivityAccess(req.params.entityId as string, fromDate);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Related Party Disclosures ---

complianceRouter.get('/disclosures/:entityId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string | undefined;
    const disclosures = await generateRelatedPartyDisclosures(
      req.params.entityId as string,
      periodId,
    );
    res.json(disclosures);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
