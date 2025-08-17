// User roles and permissions system
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

export const PERMISSIONS = {
  // Member permissions
  VIEW_TICKETS: 'view_tickets',
  CREATE_TICKETS: 'create_tickets',
  VIEW_PAYMENTS: 'view_payments',
  MAKE_PAYMENTS: 'make_payments',
  VIEW_ANNOUNCEMENTS: 'view_announcements',
  VIEW_PROFILE: 'view_profile',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  APPROVE_USERS: 'approve_users',
  VIEW_ALL_TICKETS: 'view_all_tickets',
  MANAGE_TICKETS: 'manage_tickets',
  VIEW_ALL_PAYMENTS: 'view_all_payments',
  CREATE_ANNOUNCEMENTS: 'create_announcements',
  MANAGE_ANNOUNCEMENTS: 'manage_announcements',
  VIEW_ANALYTICS: 'view_analytics',
  SYSTEM_SETTINGS: 'system_settings',
};

// Define member permissions first
const MEMBER_PERMISSIONS = [
  PERMISSIONS.VIEW_TICKETS,
  PERMISSIONS.CREATE_TICKETS,
  PERMISSIONS.VIEW_PAYMENTS,
  PERMISSIONS.MAKE_PAYMENTS,
  PERMISSIONS.VIEW_ANNOUNCEMENTS,
  PERMISSIONS.VIEW_PROFILE,
];

// Define admin permissions (includes all member permissions plus admin-specific ones)
const ADMIN_PERMISSIONS = [
  ...MEMBER_PERMISSIONS,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.APPROVE_USERS,
  PERMISSIONS.VIEW_ALL_TICKETS,
  PERMISSIONS.MANAGE_TICKETS,
  PERMISSIONS.VIEW_ALL_PAYMENTS,
  PERMISSIONS.CREATE_ANNOUNCEMENTS,
  PERMISSIONS.MANAGE_ANNOUNCEMENTS,
  PERMISSIONS.VIEW_ANALYTICS,
  PERMISSIONS.SYSTEM_SETTINGS,
];

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.MEMBER]: MEMBER_PERMISSIONS,
  [USER_ROLES.ADMIN]: ADMIN_PERMISSIONS,
};

// Utility functions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.includes(permission) : false;
};

export const getUserPermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

export const isAdmin = (userRole) => {
  return userRole === USER_ROLES.ADMIN;
};

export const isMember = (userRole) => {
  return userRole === USER_ROLES.MEMBER;
};

export const canAccessPage = (userRole, requiredPermission) => {
  return hasPermission(userRole, requiredPermission);
};
