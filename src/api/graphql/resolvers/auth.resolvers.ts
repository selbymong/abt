import {
  createUser, getUser, listUsers, updateUser,
  authenticate, checkPermission, getRolePermissions,
} from '../../../services/auth/auth-service.js';

export const authResolvers = {
  Query: {
    authUser: async (_: unknown, { id }: { id: string }) => getUser(id),
    authUsers: async (_: unknown, { role, status }: { role?: string; status?: string }) =>
      listUsers(role as any, status as any),
    rolePermissions: async (_: unknown, { role }: { role: string }) =>
      getRolePermissions(role as any),
    checkPermission: async (_: unknown, { role, resource, action }: { role: string; resource: string; action: string }) =>
      checkPermission(role as any, resource, action),
  },

  Mutation: {
    createAuthUser: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createUser(input as any);
      return getUser(id);
    },
    login: async (_: unknown, { email, password }: { email: string; password: string }) =>
      authenticate(email, password),
    updateAuthUser: async (_: unknown, { id, role, status, entityIds }: { id: string; role?: string; status?: string; entityIds?: string[] }) =>
      updateUser(id, { role: role as any, status: status as any, entity_ids: entityIds }),
  },
};
