'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, Package, ShoppingCart, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MaintenanceRequest, PurchaseRequisition } from '@/types/maintenance';
import type { ScrapRequest } from '@/types/scrap';

interface MaintenanceNotificationDropdownProps {
  inWidget?: boolean;
}

export function MaintenanceNotificationDropdown({ inWidget = false }: MaintenanceNotificationDropdownProps) {
  const { requests, pendingCount: maintenancePending, isLoading } = useMaintenanceRequests();
  const { requisitions, isLoading: isPurchaseLoading } = usePurchaseRequisitions();
  const { scrapRequests, pendingCount: scrapPending, isLoading: isScrapLoading } = useScrapRequests();
  const router = useRouter();
  
  // Track last viewed time from localStorage
  const [lastViewedTime, setLastViewedTime] = useState<string | null>(null);
  
  // Initialize last viewed time from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('maintenance-last-viewed');
      setLastViewedTime(stored);
    }
  }, []);

  // Listen for notification clearing events
  useEffect(() => {
    const handleNotificationsCleared = (event: CustomEvent) => {
      if (event.detail?.type === 'maintenance') {
        setLastViewedTime(event.detail.timestamp);
      }
    };

    window.addEventListener('notificationsCleared', handleNotificationsCleared as EventListener);
    
    return () => {
      window.removeEventListener('notificationsCleared', handleNotificationsCleared as EventListener);
    };
  }, []);

  // Get pending purchases
  const pendingPurchases = requisitions.filter(r => r.status === 'pending');
  
  // Get pending scrap requests
  const pendingScrapRequests = scrapRequests.filter(r => r.status === 'pending');
  
  const totalPending = maintenancePending + pendingPurchases.length + scrapPending;

  // DEBUG: Log to see what's happening
  // console.log('🔧 Maintenance, Purchase & Scrap notifications:', { 
  //   maintenanceTotal: requests.length, 
  //   maintenancePending,
  //   purchaseTotal: requisitions.length,
  //   purchasePending: pendingPurchases.length,
  //   scrapTotal: scrapRequests.length,
  //   scrapPending,
  //   totalPending,
  //   isLoading
  // });

  // Mark as viewed when dropdown opens
  const handleDropdownOpen = (open: boolean) => {
    if (open && typeof window !== 'undefined') {
      const now = new Date().toISOString();
      localStorage.setItem('maintenance-last-viewed', now);
      setLastViewedTime(now);
    }
  };

  // Get recent pending requests (max 5)
  const recentPendingRequests = requests
    .filter(req => req.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Get recent pending purchases (max 5)
  const recentPendingPurchases = pendingPurchases
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Get recent pending scrap requests (max 5)
  const recentPendingScrapRequests = pendingScrapRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Safe timestamp parser that handles both "with time zone" and "without time zone"
  const parseTimestamp = (timestamp: string) => {
    // If timestamp doesn't have timezone info, treat as UTC
    if (!timestamp.includes('+') && !timestamp.includes('Z')) {
      return new Date(timestamp + 'Z');
    }
    return new Date(timestamp);
  };

  // Count only new notifications (created after last view)
  // ✅ FIX: Filter ALL requests, not just recent 5
  const newMaintenanceCount = useMemo(() => {
    if (!lastViewedTime) return maintenancePending;
    
    return requests.filter(
      req => req.status === 'pending' && 
      parseTimestamp(req.created_at) > parseTimestamp(lastViewedTime)
    ).length;
  }, [requests, lastViewedTime, maintenancePending]);

  // ✅ FIX: Filter ALL pending purchases, not just recent 5
  const newPurchaseCount = useMemo(() => {
    if (!lastViewedTime) return pendingPurchases.length;
    
    return pendingPurchases.filter(
      req => parseTimestamp(req.created_at) > parseTimestamp(lastViewedTime)
    ).length;
  }, [pendingPurchases, lastViewedTime]);

  // ✅ FIX: Filter ALL pending scrap requests, not just recent 5
  const newScrapCount = useMemo(() => {
    if (!lastViewedTime) return pendingScrapRequests.length;
    
    return pendingScrapRequests.filter(
      req => parseTimestamp(req.created_at) > parseTimestamp(lastViewedTime)
    ).length;
  }, [pendingScrapRequests, lastViewedTime]);

  const totalNewCount = newMaintenanceCount + newPurchaseCount + newScrapCount;

  const handleViewRequest = (requestId: string) => {
    router.push('/admin/maintenance');
  };

  const handleViewPurchase = (purchaseId: string) => {
    router.push('/admin/maintenance');
  };

  const handleViewScrap = (scrapId: string) => {
    router.push('/admin/reports?tab=scrap');
  };

  // If inWidget, render list view instead of dropdown
  if (inWidget) {
    if (totalPending === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No pending requests
        </div>
      );
    }

    return (
      <div className="p-2">
        {/* Maintenance Requests */}
        {recentPendingRequests.map((request) => (
          <div
            key={request.id}
            className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
            onClick={() => handleViewRequest(request.id)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Maintenance
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {request.brand_name} - {request.workstation_number}
                  </p>
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {request.staff?.name || 'Unknown Staff'} • {formatDistanceToNow(parseTimestamp(request.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {request.status}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Purchase Requisitions */}
        {recentPendingPurchases.map((requisition) => (
          <div
            key={requisition.id}
            className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
            onClick={() => handleViewPurchase(requisition.id)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Purchase
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {requisition.purchase_item}
                  </p>
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {requisition.name} • {formatDistanceToNow(parseTimestamp(requisition.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {requisition.status}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Scrap Requests */}
        {recentPendingScrapRequests.map((scrapRequest) => (
          <div
            key={scrapRequest.id}
            className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
            onClick={() => handleViewScrap(scrapRequest.id)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Scrap
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {scrapRequest.brand_name} - {scrapRequest.workstation_number}
                  </p>
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {scrapRequest.submitter_name} • {formatDistanceToNow(parseTimestamp(scrapRequest.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {scrapRequest.status} • {scrapRequest.scrap_status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Wrench className="h-5 w-5" />
          {totalNewCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-600 animate-in zoom-in-50 duration-200"
              variant="default"
            >
              {totalNewCount > 9 ? '9+' : totalNewCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Pending Requests & Requisitions</h4>
          <p className="text-xs text-muted-foreground">
            {totalPending} item{totalPending !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
        
        {/* Maintenance Requests Section */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          Maintenance Requests ({maintenancePending})
        </DropdownMenuLabel>
        
        {recentPendingRequests.length === 0 ? (
          <div className="px-3 py-2 text-center text-muted-foreground text-xs">
            No pending maintenance requests
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {recentPendingRequests.map((request) => (
              <DropdownMenuItem
                key={request.id}
                className="p-3 cursor-pointer"
                onClick={() => handleViewRequest(request.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {request.staff?.name || 'Unknown Staff'}
                      </p>
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {request.branch} • {formatDistanceToNow(parseTimestamp(request.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.serial_number || request.brand_name || 'System Request'}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Purchase Requisitions Section */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          Purchase Requisitions ({pendingPurchases.length})
        </DropdownMenuLabel>

        {recentPendingPurchases.length === 0 ? (
          <div className="px-3 py-2 text-center text-muted-foreground text-xs">
            No pending purchase requisitions
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {recentPendingPurchases.map((purchase) => (
              <DropdownMenuItem
                key={purchase.id}
                className="p-3 cursor-pointer"
                onClick={() => handleViewPurchase(purchase.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {purchase.staff?.name || 'Unknown Staff'}
                      </p>
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {purchase.branch} • {formatDistanceToNow(parseTimestamp(purchase.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {purchase.purchase_item}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Scrap Requests Section */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          Scrap Requests ({pendingScrapRequests.length})
        </DropdownMenuLabel>

        {recentPendingScrapRequests.length === 0 ? (
          <div className="px-3 py-2 text-center text-muted-foreground text-xs">
            No pending scrap requests
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {recentPendingScrapRequests.map((scrapRequest) => (
              <DropdownMenuItem
                key={scrapRequest.id}
                className="p-3 cursor-pointer"
                onClick={() => handleViewScrap(scrapRequest.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {scrapRequest.submitter_name}
                      </p>
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {scrapRequest.branch} • {formatDistanceToNow(parseTimestamp(scrapRequest.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {scrapRequest.brand_name} - {scrapRequest.workstation_number}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="p-3 cursor-pointer"
          onClick={() => router.push('/admin/maintenance')}
        >
          <div className="flex items-center justify-center w-full text-sm text-primary">
            View All ({totalPending} pending)
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
