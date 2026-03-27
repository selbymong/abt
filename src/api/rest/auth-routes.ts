import { Router, Request, Response, NextFunction } from 'express';
import {
  createUser, getUser, getUserByEmail, listUsers, updateUser,
  authenticate, verifyToken, checkPermission, checkEntityAccess,
  getRolePermissions,
} from '../../services/auth/auth-service.js';
import { validateBody, createUserSchema, loginSchema } from './validation.js';

export const authRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Authentication ---
authRouter.post('/login', validateBody(loginSchema), wrap(async (req, res) => {
  const { email, password } = req.body;
  const authToken = await authenticate(email, password);
  res.json(authToken);
}));

authRouter.post('/verify', wrap(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'No token provided' }); return; }

  const verified = verifyToken(token);
  if (!verified) { res.status(401).json({ error: 'Invalid or expired token' }); return; }

  res.json({ valid: true, userId: verified.userId, role: verified.role, entityIds: verified.entityIds });
}));

// --- Users ---
authRouter.post('/users', validateBody(createUserSchema), wrap(async (req, res) => {
  const id = await createUser(req.body);
  const user = await getUser(id);
  res.status(201).json(user);
}));

authRouter.get('/users/:id', wrap(async (req, res) => {
  const user = await getUser(req.params.id as string);
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(user);
}));

authRouter.get('/users', wrap(async (req, res) => {
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined;
  const users = await listUsers(role as any, status as any);
  res.json({ users });
}));

authRouter.patch('/users/:id', wrap(async (req, res) => {
  const user = await updateUser(req.params.id as string, req.body);
  res.json(user);
}));

// --- Permissions ---
authRouter.get('/permissions/:role', wrap(async (req, res) => {
  const permissions = getRolePermissions(req.params.role as any);
  res.json({ permissions });
}));

authRouter.post('/check-permission', wrap(async (req, res) => {
  const { role, resource, action } = req.body;
  const allowed = checkPermission(role, resource, action);
  res.json({ allowed });
}));

authRouter.post('/check-entity-access', wrap(async (req, res) => {
  const { userEntityIds, targetEntityId } = req.body;
  const allowed = checkEntityAccess(userEntityIds, targetEntityId);
  res.json({ allowed });
}));
