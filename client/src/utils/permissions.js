// Role-based permission helper
// Admin   → full access
// Sales   → view all, create/edit customers & challans. No product add/edit, no stock adjust, no users
// Warehouse → view all, add/edit products & stock adjust. No challans, no users
// Accounts  → read-only across all modules

export const PERMISSIONS = {
  canManageProducts: (role) => ['Admin', 'Warehouse'].includes(role),
  canAdjustStock:    (role) => ['Admin', 'Warehouse'].includes(role),
  canCreateChallan:  (role) => ['Admin', 'Sales'].includes(role),
  canCancelChallan:  (role) => ['Admin', 'Sales'].includes(role),
  canManageCustomers:(role) => ['Admin', 'Sales'].includes(role),
  canManageUsers:    (role) => role === 'Admin',
};
