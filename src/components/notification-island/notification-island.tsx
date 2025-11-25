'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CategoryData } from '@/hooks/use-notification-categories';
import { useNotificationSound } from '@/hooks/use-notification-sound';

interface NotificationIslandProps {
  categories: CategoryData[];
  onMarkAllRead: () => void;
  onMarkCategoryRead: (category: string) => void;
  onNotificationClick?: (notification: any) => void;
  position?: 'bottom' | 'top';
  soundEnabled?: boolean;
  className?: string;
}

type ViewState = 'idle' | 'compact' | 'expanded';

export function NotificationIsland({
  categories,
  onMarkAllRead,
  onMarkCategoryRead,
  onNotificationClick,
  position = 'bottom',
  soundEnabled = true,
  className
}: NotificationIslandProps) {
  const [view, setView] = useState<ViewState>('idle');
  const [previousTotal, setPreviousTotal] = useState(0);
  const { checkAndPlaySound } = useNotificationSound();

  const total = categories.reduce((sum, cat) => sum + cat.count, 0);
  const hasNotifications = total > 0;

  // Play sound when new notifications arrive
  useEffect(() => {
    if (total > previousTotal && soundEnabled) {
      checkAndPlaySound(total);
    }
    setPreviousTotal(total);
  }, [total, previousTotal, soundEnabled, checkAndPlaySound]);

  const handleToggle = () => {
    if (view === 'idle') {
      setView('expanded');
    } else {
      setView('idle');
    }
  };

  const handleMarkAllRead = () => {
    onMarkAllRead();
    setView('idle');
  };

  const handleCategoryRead = (categoryType: string) => {
    onMarkCategoryRead(categoryType);
  };

  const positionClasses = position === 'bottom' 
    ? 'bottom-8 left-1/2 -translate-x-1/2' 
    : 'top-8 left-1/2 -translate-x-1/2';

  return (
    <div className={cn('fixed z-50', positionClasses, className)}>
      <AnimatePresence mode="wait">
        {view === 'idle' && (
          <motion.div
            key="idle"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-2 bg-primary/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/20"
            onClick={handleToggle}
          >
            {categories.map((category) => (
              <div key={category.type} className="relative">
                <span className="text-lg">{category.icon}</span>
                {category.count > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"
                  />
                )}
              </div>
            ))}
            {hasNotifications && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2"
              >
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {total}
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}

        {view === 'expanded' && (
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-96 max-h-[600px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllRead}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Mark All Read
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setView('idle')}
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[500px]">
              {categories.map((category, index) => (
                <div key={category.type}>
                  {category.count > 0 && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {category.label}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {category.count}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCategoryRead(category.type)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark Read
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {category.notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => onNotificationClick?.(notification)}
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {notification.title}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {category.notifications.length > 5 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                            +{category.notifications.length - 5} more notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {index < categories.length - 1 && category.count > 0 && (
                    <Separator className="mx-4" />
                  )}
                </div>
              ))}

              {!hasNotifications && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🔔</div>
                  <div className="text-sm">No new notifications</div>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



