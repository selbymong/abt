/**
 * Authentication & RBAC Service
 *
 * Implements:
 * - User management (create, get, list, update, deactivate)
 * - JWT token generation and verification
 * - Role-based access control (ADMIN, CFO, CONTROLLER, BOOKKEEPER, AUDITOR, VIEWER)
 * - Entity-scoped permissions (user can only access assigned entities)
 * - Permission checking middleware
 * - Session tracking
 */
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';
import { query } from '../../lib/pg.js';

// ============================================================
// Types
// ============================================================

export type Role = 'ADMIN' | 'CFO' | 'CONTROLLER' | 'BOOKKEEPER' | 'AUDITOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  entityIds: string[];
  password: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  status: UserStatus;
  entity_ids: string[];
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  token: string;
  userId: string;
  email: string;
  role: Role;
  entityIds: string[];
  expiresAt: number;
}

export interface Permission {
  resource: string;
  actions: string[];
}

// ============================================================
// Role Permission Matrix
// ============================================================

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    { resource: '*', actions: ['*'] },
  ],
  CFO: [
    { resource: 'gl', actions: ['read', 'write', 'approve', 'close'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'budgets', actions: ['read', 'write', 'approve'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'config', actions: ['read', 'write'] },
    { resource: 'payroll', actions: ['read', 'approve'] },
    { resource: 'ap', actions: ['read', 'approve'] },
    { resource: 'ar', actions: ['read', 'approve'] },
  ],
  CONTROLLER: [
    { resource: 'gl', actions: ['read', 'write', 'approve'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'budgets', actions: ['read', 'write'] },
    { resource: 'config', actions: ['read'] },
    { resource: 'payroll', actions: ['read', 'write'] },
    { resource: 'ap', actions: ['read', 'write', 'approve'] },
    { resource: 'ar', actions: ['read', 'write', 'approve'] },
  ],
  BOOKKEEPER: [
    { resource: 'gl', actions: ['read', 'write'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'ap', actions: ['read', 'write'] },
    { resource: 'ar', actions: ['read', 'write'] },
    { resource: 'payroll', actions: ['read'] },
  ],
  AUDITOR: [
    { resource: 'gl', actions: ['read'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'budgets', actions: ['read'] },
    { resource: 'config', actions: ['read'] },
    { resource: 'ap', actions: ['read'] },
    { resource: 'ar', actions: ['read'] },
    { resource: 'payroll', actions: ['read'] },
    { resource: 'audit', actions: ['read'] },
  ],
  VIEWER: [
    { resource: 'reports', actions: ['read'] },
    { resource: 'budgets', actions: ['read'] },
  ],
};

// ============================================================
// Password Hashing
// ============================================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// ============================================================
// JWT-like Token (simplified — production would use jsonwebtoken)
// ============================================================

const TOKEN_SECRET = process.env.JWT_SECRET ?? 'ebg-dev-secret-change-in-production';
const TOKEN_EXPIRY_HOURS = 8;

export function generateToken(user: User): AuthToken {
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    entityIds: user.entity_ids,
    expiresAt,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return {
    token: `${payloadStr}.${signature}`,
    userId: user.id,
    email: user.email,
    role: user.role,
    entityIds: user.entity_ids,
    expiresAt,
  };
}

export function verifyToken(token: string): AuthToken | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
  if (payload.expiresAt < Date.now()) return null;

  return {
    token,
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    entityIds: payload.entityIds,
    expiresAt: payload.expiresAt,
  };
}

// ============================================================
// User CRUD
// ============================================================

export async function createUser(input: CreateUserInput): Promise<string> {
  const id = uuid();
  const passwordHash = hashPassword(input.password);

  await query(
    `INSERT INTO users (id, email, first_name, last_name, role, status, entity_ids, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, NOW(), NOW())`,
    [id, input.email, input.firstName, input.lastName, input.role,
     JSON.stringify(input.entityIds), passwordHash],
  );

  return id;
}

export async function getUser(id: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, first_name, last_name, role, status, entity_ids, last_login, created_at, updated_at
     FROM users WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as any;
  return {
    ...row,
    entity_ids: typeof row.entity_ids === 'string' ? JSON.parse(row.entity_ids) : row.entity_ids,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, first_name, last_name, role, status, entity_ids, last_login, created_at, updated_at
     FROM users WHERE email = $1`,
    [email],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as any;
  return {
    ...row,
    entity_ids: typeof row.entity_ids === 'string' ? JSON.parse(row.entity_ids) : row.entity_ids,
  };
}

export async function listUsers(role?: Role, status?: UserStatus): Promise<User[]> {
  let sql = 'SELECT id, email, first_name, last_name, role, status, entity_ids, last_login, created_at, updated_at FROM users WHERE 1=1';
  const params: unknown[] = [];
  let idx = 1;

  if (role) {
    sql += ` AND role = $${idx++}`;
    params.push(role);
  }
  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }

  sql += ' ORDER BY last_name, first_name';
  const result = await query(sql, params);
  return result.rows.map((r: any) => ({
    ...r,
    entity_ids: typeof r.entity_ids === 'string' ? JSON.parse(r.entity_ids) : r.entity_ids,
  }));
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'role' | 'status' | 'entity_ids'> & { firstName?: string; lastName?: string }>,
): Promise<User> {
  const setClauses: string[] = [];
  const params: unknown[] = [id];
  let idx = 2;

  if (updates.role) {
    setClauses.push(`role = $${idx++}`);
    params.push(updates.role);
  }
  if (updates.status) {
    setClauses.push(`status = $${idx++}`);
    params.push(updates.status);
  }
  if (updates.entity_ids) {
    setClauses.push(`entity_ids = $${idx++}`);
    params.push(JSON.stringify(updates.entity_ids));
  }
  if (updates.firstName) {
    setClauses.push(`first_name = $${idx++}`);
    params.push(updates.firstName);
  }
  if (updates.lastName) {
    setClauses.push(`last_name = $${idx++}`);
    params.push(updates.lastName);
  }

  setClauses.push('updated_at = NOW()');

  await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1`,
    params,
  );

  const user = await getUser(id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
}

// ============================================================
// Authentication
// ============================================================

export async function authenticate(email: string, password: string): Promise<AuthToken> {
  const result = await query(
    'SELECT id, email, first_name, last_name, role, status, entity_ids, password_hash FROM users WHERE email = $1',
    [email],
  );

  if (result.rows.length === 0) throw new Error('Invalid email or password');

  const row = result.rows[0] as any;
  if (row.status !== 'ACTIVE') throw new Error('Account is not active');
  if (!verifyPassword(password, row.password_hash)) throw new Error('Invalid email or password');

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [row.id]);

  const user: User = {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    status: row.status,
    entity_ids: typeof row.entity_ids === 'string' ? JSON.parse(row.entity_ids) : row.entity_ids,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return generateToken(user);
}

// ============================================================
// Authorization
// ============================================================

export function checkPermission(role: Role, resource: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.some((p) => {
    const resourceMatch = p.resource === '*' || p.resource === resource;
    const actionMatch = p.actions.includes('*') || p.actions.includes(action);
    return resourceMatch && actionMatch;
  });
}

export function checkEntityAccess(userEntityIds: string[], targetEntityId: string): boolean {
  // ADMIN has access to all entities (checked via role)
  return userEntityIds.includes(targetEntityId);
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
