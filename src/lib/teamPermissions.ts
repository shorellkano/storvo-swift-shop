export type TeamRole =
  | "owner"
  | "admin"
  | "customer_support"
  | "operations"
  | "developer_support";

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Business Owner",
  admin: "Admin",
  customer_support: "Customer Support",
  operations: "Operations",
  developer_support: "Developer Support",
};

export const ROLE_COLORS: Record<TeamRole, string> = {
  owner: "bg-violet-100 text-violet-700 border-violet-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  customer_support: "bg-emerald-100 text-emerald-700 border-emerald-200",
  operations: "bg-amber-100 text-amber-700 border-amber-200",
  developer_support: "bg-slate-100 text-slate-700 border-slate-200",
};

export type Permission =
  | "store.settings"
  | "store.billing"
  | "store.delete"
  | "store.ownership"
  | "team.manage"
  | "products.manage"
  | "products.view"
  | "orders.manage"
  | "orders.view"
  | "customers.manage"
  | "customers.view"
  | "analytics.view"
  | "inventory.manage"
  | "settings.integrations";

const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  owner: [
    "store.settings",
    "store.billing",
    "store.delete",
    "store.ownership",
    "team.manage",
    "products.manage",
    "products.view",
    "orders.manage",
    "orders.view",
    "customers.manage",
    "customers.view",
    "analytics.view",
    "inventory.manage",
    "settings.integrations",
  ],
  admin: [
    "products.manage",
    "products.view",
    "orders.manage",
    "orders.view",
    "customers.manage",
    "customers.view",
    "analytics.view",
    "inventory.manage",
  ],
  customer_support: [
    "orders.view",
    "orders.manage",
    "customers.view",
    "products.view",
  ],
  operations: [
    "orders.view",
    "orders.manage",
    "inventory.manage",
    "products.view",
  ],
  developer_support: [
    "settings.integrations",
    "store.settings",
    "products.view",
  ],
};

export const hasPermission = (role: TeamRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role].includes(permission);
};

export const INVITABLE_ROLES: TeamRole[] = [
  "admin",
  "customer_support",
  "operations",
  "developer_support",
];

export const MAX_TEAM_MEMBERS_PRO = 5;
