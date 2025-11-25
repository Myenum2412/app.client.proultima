import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  reference_table?: string;
  is_viewed: boolean;
  metadata: Record<string, any>;
  created_at: string;
  viewed_at?: string;
}

export interface CategoryData {
  type: string;
  count: number;
  notifications: Notification[];
  icon: string;
  label: string;
}

export interface NotificationCategories {
  tasks: CategoryData;
  proofs: CategoryData;          // NEW
  reschedules: CategoryData;     // NEW
  cashbook: CategoryData;
  maintenance: CategoryData;
  purchase: CategoryData;
  scrap: CategoryData;
  total: number;
}

const NOTIFICATION_TYPES = {
  tasks: [
    'task_assignment', 
    'task_update', 
    'task_delegation',
    'task_status_update',        // NEW: Staff updates task status
    'task_delegation_received'   // NEW: Task delegated to you
  ],
  proofs: [                      // NEW CATEGORY
    'task_proof_upload',
    'task_proof_verified',
    'task_proof_rejected'
  ],
  reschedules: [                 // NEW CATEGORY
    'task_reschedule_request',
    'task_reschedule_approved',
    'task_reschedule_rejected'
  ],
  cashbook: ['cashbook_entry', 'cashbook_verification_required', 'cashbook_transaction_approved', 'cashbook_transaction_rejected'],
  maintenance: ['maintenance_request', 'maintenance_status_update'],
  purchase: ['purchase_request', 'purchase_status_update'],
  scrap: ['scrap_request', 'scrap_status_update'],
};

const CATEGORY_CONFIG = {
  tasks: { icon: '🔔', label: 'Tasks' },
  proofs: { icon: '📸', label: 'Proofs' },        // NEW
  reschedules: { icon: '📅', label: 'Reschedules' }, // NEW
  cashbook: { icon: '📊', label: 'Cashbook' },
  maintenance: { icon: '🔧', label: 'Maintenance' },
  purchase: { icon: '🛒', label: 'Purchase' },
  scrap: { icon: '🗑️', label: 'Scrap' },
};

export function useNotificationCategories() {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['notification-categories', user?.id],
    queryFn: async (): Promise<NotificationCategories> => {
      if (!user?.id) {
        return {
          tasks: { type: 'tasks', count: 0, notifications: [], icon: '🔔', label: 'Tasks' },
          proofs: { type: 'proofs', count: 0, notifications: [], icon: '📸', label: 'Proofs' },
          reschedules: { type: 'reschedules', count: 0, notifications: [], icon: '📅', label: 'Reschedules' },
          cashbook: { type: 'cashbook', count: 0, notifications: [], icon: '📊', label: 'Cashbook' },
          maintenance: { type: 'maintenance', count: 0, notifications: [], icon: '🔧', label: 'Maintenance' },
          purchase: { type: 'purchase', count: 0, notifications: [], icon: '🛒', label: 'Purchase' },
          scrap: { type: 'scrap', count: 0, notifications: [], icon: '🗑️', label: 'Scrap' },
          total: 0,
        };
      }

      // Fetch all unviewed notifications for the user
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_viewed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      // Group notifications by category
      const categories: NotificationCategories = {
        tasks: { type: 'tasks', count: 0, notifications: [], icon: '🔔', label: 'Tasks' },
        proofs: { type: 'proofs', count: 0, notifications: [], icon: '📸', label: 'Proofs' },
        reschedules: { type: 'reschedules', count: 0, notifications: [], icon: '📅', label: 'Reschedules' },
        cashbook: { type: 'cashbook', count: 0, notifications: [], icon: '📊', label: 'Cashbook' },
        maintenance: { type: 'maintenance', count: 0, notifications: [], icon: '🔧', label: 'Maintenance' },
        purchase: { type: 'purchase', count: 0, notifications: [], icon: '🛒', label: 'Purchase' },
        scrap: { type: 'scrap', count: 0, notifications: [], icon: '🗑️', label: 'Scrap' },
        total: 0,
      };

      // Categorize notifications
      notifications?.forEach((notification) => {
        for (const [categoryKey, types] of Object.entries(NOTIFICATION_TYPES)) {
          if (types.includes(notification.type)) {
            const category = categories[categoryKey as keyof NotificationCategories];
            // Type guard: check if it's a CategoryData object (not the total number)
            if (category && typeof category === 'object' && 'type' in category && 'notifications' in category) {
              category.notifications.push(notification);
              category.count++;
              categories.total++;
            }
            break;
          }
        }
      });

      return categories;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const supabase = createClient();

  return async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_viewed: true, 
        viewed_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('is_viewed', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  };
}

export function useMarkCategoryRead() {
  const { user } = useAuth();
  const supabase = createClient();

  return async (categoryType: string) => {
    if (!user?.id) return;

    const types = NOTIFICATION_TYPES[categoryType as keyof typeof NOTIFICATION_TYPES];
    if (!types) return;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_viewed: true, 
        viewed_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('is_viewed', false)
      .in('type', types);

    if (error) {
      console.error('Error marking category notifications as read:', error);
      throw error;
    }
  };
}
