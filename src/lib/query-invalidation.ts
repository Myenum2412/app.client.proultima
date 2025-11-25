/**
 * Centralized query invalidation helper
 * Ensures mutations consistently invalidate all affected queries
 */

import { QueryClient } from '@tanstack/react-query';

export const invalidateTaskRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['attendance-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
};

export const invalidateMaintenanceRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['maintenance-pending-count'] });
};

export const invalidatePurchaseRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['purchase-pending-count'] });
};

export const invalidateScrapRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
  queryClient.invalidateQueries({ queryKey: ['scrap-requests-pending-count'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
};

export const invalidateSupportRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['support-pending-count'] });
};

export const invalidateCashbookRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
  queryClient.invalidateQueries({ queryKey: ['branch-opening-balances'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
};

export const invalidateStaffRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['staff'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
  queryClient.invalidateQueries({ queryKey: ['team-members'] });
};

export const invalidateTeamsRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['teams'] });
  queryClient.invalidateQueries({ queryKey: ['team-members'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
};

export const invalidateAssetRequestsRelated = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['asset-requests-pending-count'] });
};

export const invalidateAllDashboardStats = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
  queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
  queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
  queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
  queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
  queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
};

export const invalidateAllNotifications = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['notification-count'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['maintenance-notifications'] });
  queryClient.invalidateQueries({ queryKey: ['purchase-notifications'] });
  queryClient.invalidateQueries({ queryKey: ['scrap-notifications'] });
  queryClient.invalidateQueries({ queryKey: ['support-notifications'] });
  queryClient.invalidateQueries({ queryKey: ['task-notifications'] });
};

/**
 * Generic invalidation function that accepts query keys
 */
export const invalidateQueries = (queryClient: QueryClient, queryKeys: string[]) => {
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

/**
 * Invalidate queries with pattern matching
 */
export const invalidateQueriesByPattern = (queryClient: QueryClient, pattern: string) => {
  queryClient.invalidateQueries({ 
    predicate: (query) => {
      const queryKey = query.queryKey[0] as string;
      return queryKey.includes(pattern);
    }
  });
};
