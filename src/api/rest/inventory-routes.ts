import { Router, Request, Response } from 'express';
import {
  createInventoryItem,
  getInventoryItem,
  listInventoryItems,
  createInventoryLot,
  getInventoryLot,
  listInventoryLots,
  receiveInventory,
  issueInventory,
  testNRV,
  getInventoryValuation,
} from '../../services/gl/inventory-service.js';

export const inventoryRouter = Router();

// --- Inventory Items ---

inventoryRouter.post('/items', async (req: Request, res: Response) => {
  try {
    const id = await createInventoryItem(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

inventoryRouter.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const item = await getInventoryItem(req.params.id as string);
    if (!item) return res.status(404).json({ error: 'InventoryItem not found' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

inventoryRouter.get('/items/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const items = await listInventoryItems(req.params.entityId as string, category as any);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Inventory Lots ---

inventoryRouter.post('/lots', async (req: Request, res: Response) => {
  try {
    const id = await createInventoryLot(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

inventoryRouter.get('/lots/:id', async (req: Request, res: Response) => {
  try {
    const lot = await getInventoryLot(req.params.id as string);
    if (!lot) return res.status(404).json({ error: 'InventoryLot not found' });
    res.json(lot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

inventoryRouter.get('/lots/by-item/:itemId', async (req: Request, res: Response) => {
  try {
    const includeDepleted = req.query.includeDepleted === 'true';
    const lots = await listInventoryLots(req.params.itemId as string, includeDepleted);
    res.json(lots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Receive / Issue ---

inventoryRouter.post('/receive', async (req: Request, res: Response) => {
  try {
    const result = await receiveInventory(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

inventoryRouter.post('/issue', async (req: Request, res: Response) => {
  try {
    const result = await issueInventory(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- NRV Testing ---

inventoryRouter.post('/nrv-test', async (req: Request, res: Response) => {
  try {
    const result = await testNRV(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Valuation Report ---

inventoryRouter.get('/valuation/:entityId', async (req: Request, res: Response) => {
  try {
    const report = await getInventoryValuation(req.params.entityId as string);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
