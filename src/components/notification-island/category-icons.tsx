import React from 'react';
import { 
  CheckSquare, 
  DollarSign, 
  Wrench, 
  ShoppingCart, 
  Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  type: 'tasks' | 'cashbook' | 'maintenance' | 'purchase' | 'scrap';
  hasNotification?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap = {
  tasks: CheckSquare,
  cashbook: DollarSign,
  maintenance: Wrench,
  purchase: ShoppingCart,
  scrap: Trash2,
};

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function CategoryIcon({ 
  type, 
  hasNotification = false, 
  className,
  size = 'md' 
}: CategoryIconProps) {
  const IconComponent = iconMap[type];
  
  return (
    <div className="relative">
      <IconComponent 
        className={cn(
          sizeMap[size],
          'text-gray-600 dark:text-gray-300',
          hasNotification && 'text-blue-600 dark:text-blue-400',
          className
        )} 
      />
      {hasNotification && (
        <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

export function TaskIcon({ hasNotification, className, size }: Omit<CategoryIconProps, 'type'>) {
  return <CategoryIcon type="tasks" hasNotification={hasNotification} className={className} size={size} />;
}

export function CashbookIcon({ hasNotification, className, size }: Omit<CategoryIconProps, 'type'>) {
  return <CategoryIcon type="cashbook" hasNotification={hasNotification} className={className} size={size} />;
}

export function MaintenanceIcon({ hasNotification, className, size }: Omit<CategoryIconProps, 'type'>) {
  return <CategoryIcon type="maintenance" hasNotification={hasNotification} className={className} size={size} />;
}

export function PurchaseIcon({ hasNotification, className, size }: Omit<CategoryIconProps, 'type'>) {
  return <CategoryIcon type="purchase" hasNotification={hasNotification} className={className} size={size} />;
}

export function ScrapIcon({ hasNotification, className, size }: Omit<CategoryIconProps, 'type'>) {
  return <CategoryIcon type="scrap" hasNotification={hasNotification} className={className} size={size} />;
}



