'use client';

import { useState, useEffect } from 'react';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useAssetRequests } from '@/hooks/use-asset-requests';
import { useGroceryRequests } from '@/hooks/use-grocery-requests';
import { useAuth } from '@/contexts/auth-context';
import { MaintenanceApprovalDialog } from '@/components/admin/maintenance-approval-dialog';
import { PurchaseApprovalDialog } from '@/components/admin/purchase-approval-dialog';
import { VerifyProductDialog } from '@/components/admin/verify-product-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart, Settings, Package, Monitor, Filter, X, Building2, Users, CalendarDays, Tag, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStaff } from '@/hooks/use-staff';
import { useSystemOptions } from '@/hooks/use-system-options';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DownloadMaintenancePDF } from '@/components/maintenance/download-maintenance-pdf';
import { DownloadPurchasePDF } from '@/components/purchase/download-purchase-pdf';
import { DownloadScrapPDF } from '@/components/scrap/download-scrap-pdf';
import { ScrapApprovalDialog } from '@/components/admin/scrap-approval-dialog';
import { GroceryApprovalDialog } from '@/components/admin/grocery-approval-dialog';
import { GroceryReportTable } from '@/components/admin/grocery-report-table';
import { AssetRequestsTable } from '@/components/admin/asset-requests-table';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { TablePagination } from '@/components/ui/table-pagination';
import type { MaintenanceRequest, PurchaseRequisition } from '@/types/maintenance';
import type { ScrapRequest } from '@/types/scrap';
import type { GroceryRequest } from '@/types';

export default function AdminMaintenancePage() {
  const { user } = useAuth();
  const { requests, pendingCount, isLoading, refetch } = useMaintenanceRequests();
  const { requisitions, isLoading: isPurchaseLoading, refetch: refetchPurchases, verifyProduct, isVerifying } = usePurchaseRequisitions();
  const { scrapRequests, isLoading: isScrapLoading } = useScrapRequests();
  const { assetRequests, isLoading: isAssetLoading } = useAssetRequests();
  const { groceryRequests, isLoading: isGroceryLoading, stats: groceryStats } = useGroceryRequests();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequisition | null>(null);
  const [selectedScrap, setSelectedScrap] = useState<ScrapRequest | null>(null);
  const [selectedGrocery, setSelectedGrocery] = useState<GroceryRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isScrapDialogOpen, setIsScrapDialogOpen] = useState(false);
  const [isGroceryDialogOpen, setIsGroceryDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [selectedPurchaseForVerify, setSelectedPurchaseForVerify] = useState<PurchaseRequisition | null>(null);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Card filter states for each tab
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<string>('all');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('all');
  const [groceryStatusFilter, setGroceryStatusFilter] = useState<string>('all');
  const [scrapStatusFilter, setScrapStatusFilter] = useState<string>('all');
  
  // Pagination states for Maintenance Requests
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Pagination states for Purchase Requisitions
  const [purchaseCurrentPage, setPurchaseCurrentPage] = useState(1);
  const [purchaseRowsPerPage, setPurchaseRowsPerPage] = useState(10);
  
  // Pagination states for Asset Requests
  const [assetCurrentPage, setAssetCurrentPage] = useState(1);
  const [assetRowsPerPage, setAssetRowsPerPage] = useState(10);
  
  // Pagination states for Stationary Requests
  const [stationaryCurrentPage, setStationaryCurrentPage] = useState(1);
  const [stationaryRowsPerPage, setStationaryRowsPerPage] = useState(10);
  
  // Pagination states for Scrap Requests
  const [scrapCurrentPage, setScrapCurrentPage] = useState(1);
  const [scrapRowsPerPage, setScrapRowsPerPage] = useState(10);

  // Get staff data for filters
  const { staff } = useStaff();

  // Get system options from admin settings
  const { branches, departments, expense_categories } = useSystemOptions();

  // Calculate stats for maintenance
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  // Calculate stats for purchase requisitions
  const purchaseStats = {
    total: requisitions.length,
    pending: requisitions.filter(r => r.status === 'pending').length,
    approved: requisitions.filter(r => r.status === 'approved').length,
    rejected: requisitions.filter(r => r.status === 'rejected').length,
  };

  // Calculate stats for scrap requests
  const scrapStats = {
    total: scrapRequests.length,
    pending: scrapRequests.filter(r => r.status === 'pending').length,
    approved: scrapRequests.filter(r => r.status === 'approved').length,
    rejected: scrapRequests.filter(r => r.status === 'rejected').length,
  };

  // Helper function to count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedBranch !== 'all') count++;
    if (selectedStaff !== 'all') count++;
    if (selectedDepartment !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  };

  const handleClearFilters = () => {
    setSelectedBranch('all');
    setSelectedStaff('all');
    setSelectedDepartment('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  // Apply filters to maintenance requests
  const filteredRequests = requests.filter((r) => {
    if (selectedBranch !== 'all' && r.branch !== selectedBranch) return false;
    if (selectedStaff !== 'all' && r.staff_id !== selectedStaff) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (maintenanceStatusFilter !== 'all' && r.status !== maintenanceStatusFilter) return false;
    if (startDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      if (requestDate < startDate) return false;
    }
    if (endDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      // Set end date to end of day for inclusive filtering
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (requestDate > endOfDay) return false;
    }
    return true;
  });

  // Pagination logic for maintenance requests
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPurchaseCurrentPage(1);
    setAssetCurrentPage(1);
    setStationaryCurrentPage(1);
    setScrapCurrentPage(1);
  }, [selectedBranch, selectedStaff, selectedDepartment, startDate, endDate, selectedCategory, selectedStatus, maintenanceStatusFilter, purchaseStatusFilter, assetStatusFilter, groceryStatusFilter, scrapStatusFilter]);
  
  // Reset pagination when card filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [maintenanceStatusFilter]);
  
  useEffect(() => {
    setPurchaseCurrentPage(1);
  }, [purchaseStatusFilter]);
  
  useEffect(() => {
    setAssetCurrentPage(1);
  }, [assetStatusFilter]);
  
  useEffect(() => {
    setScrapCurrentPage(1);
  }, [scrapStatusFilter]);
  
  useEffect(() => {
    setStationaryCurrentPage(1);
  }, [groceryStatusFilter]);

  // Apply filters to purchase requisitions
  const filteredRequisitions = requisitions.filter((r) => {
    if (selectedBranch !== 'all' && r.branch !== selectedBranch) return false;
    if (selectedStaff !== 'all' && r.staff_id !== selectedStaff) return false;
    if (selectedDepartment !== 'all' && r.department !== selectedDepartment) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (purchaseStatusFilter !== 'all' && r.status !== purchaseStatusFilter) return false;
    if (startDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      if (requestDate < startDate) return false;
    }
    if (endDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (requestDate > endOfDay) return false;
    }
    return true;
  });

  // Pagination logic for purchase requisitions
  const purchaseStartIndex = (purchaseCurrentPage - 1) * purchaseRowsPerPage;
  const purchaseEndIndex = purchaseStartIndex + purchaseRowsPerPage;
  const paginatedRequisitions = filteredRequisitions.slice(purchaseStartIndex, purchaseEndIndex);

  // Apply filters to scrap requests
  const filteredScrapRequests = scrapRequests.filter((r) => {
    if (selectedBranch !== 'all' && r.branch !== selectedBranch) return false;
    if (selectedStaff !== 'all' && r.staff_id !== selectedStaff) return false;
    if (selectedDepartment !== 'all' && r.staff?.department !== selectedDepartment) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (scrapStatusFilter !== 'all' && r.status !== scrapStatusFilter) return false;
    if (startDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      if (requestDate < startDate) return false;
    }
    if (endDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (requestDate > endOfDay) return false;
    }
    return true;
  });

  // Pagination logic for scrap requests
  const scrapStartIndex = (scrapCurrentPage - 1) * scrapRowsPerPage;
  const scrapEndIndex = scrapStartIndex + scrapRowsPerPage;
  const paginatedScrapRequests = filteredScrapRequests.slice(scrapStartIndex, scrapEndIndex);

  // Apply filters to asset requests
  const filteredAssetRequests = assetRequests.filter((r) => {
    if (selectedBranch !== 'all' && r.branch !== selectedBranch) return false;
    if (selectedStaff !== 'all' && r.staff_id !== selectedStaff) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (assetStatusFilter !== 'all' && r.status !== assetStatusFilter) return false;
    if (startDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      if (requestDate < startDate) return false;
    }
    if (endDate) {
      const requestDate = new Date(r.requested_date || r.created_at);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (requestDate > endOfDay) return false;
    }
    return true;
  });

  // Pagination logic for asset requests
  const assetStartIndex = (assetCurrentPage - 1) * assetRowsPerPage;
  const assetEndIndex = assetStartIndex + assetRowsPerPage;
  const paginatedAssetRequests = filteredAssetRequests.slice(assetStartIndex, assetEndIndex);

  const handleViewRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleViewPurchase = (purchase: PurchaseRequisition) => {
    setSelectedPurchase(purchase);
    setIsPurchaseDialogOpen(true);
  };

  const handleClosePurchaseDialog = () => {
    setIsPurchaseDialogOpen(false);
    setSelectedPurchase(null);
  };

  const handleVerifyProduct = (approve: boolean, verification_notes?: string) => {
    if (!selectedPurchaseForVerify || !user?.id) return;
    
    verifyProduct({
      id: selectedPurchaseForVerify.id,
      verified_by: user.id,
      verification_notes,
      approve,
    });
    
    setIsVerifyDialogOpen(false);
    setSelectedPurchaseForVerify(null);
  };

  const handleViewScrap = (scrap: ScrapRequest) => {
    setSelectedScrap(scrap);
    setIsScrapDialogOpen(true);
  };

  const handleCloseScrapDialog = () => {
    setIsScrapDialogOpen(false);
    setSelectedScrap(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'verification_pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"><Clock className="h-3 w-3 mr-1" />Awaiting Product Upload</Badge>;
      case 'awaiting_final_verification':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Completed ✓</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRunningStatusBadge = (status: string) => {
    return status === 'running' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">Not Running</Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight max-sm:text-xl">Maintenance Management</h1>
          <p className="text-muted-foreground">
            Review and approve maintenance requests and purchase requisitions
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-2 border-muted/50 shadow-sm max-sm:-mb-10">
        <CardHeader className="pb-3 max-sm:pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Filters</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Refine your request search
                </CardDescription>
              </div>
            </div>
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {getActiveFiltersCount()} Active
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filter Grid - Responsive layout */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3 sm:gap-4">
            {/* Status Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="status" className="text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Status</span>
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9 sm:h-10 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="verification_pending">Verification Pending</SelectItem>
                  <SelectItem value="awaiting_final_verification">Awaiting Final Verification</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="category" className="text-xs font-medium flex items-center gap-1.5">
                <Tag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Category</span>
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 sm:h-10 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expense_categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned Staff Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="staff" className="text-xs font-medium flex items-center gap-1.5">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Staff</span>
              </Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="h-9 sm:h-10 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="branch" className="text-xs font-medium flex items-center gap-1.5">
                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Branch</span>
              </Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-9 sm:h-10 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="department" className="text-xs font-medium flex items-center gap-1.5">
                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Dept</span>
              </Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 sm:h-10 w-full text-xs sm:text-sm">
                  <SelectValue placeholder="All Depts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="start_date" className="text-xs font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">Start Date</span>
              </Label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                placeholder="Start"
                className="h-9 sm:h-10 w-full text-xs"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <Label htmlFor="end_date" className="text-xs font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">End Date</span>
              </Label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                placeholder="End"
                className="h-9 sm:h-10 w-full text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Maintenance, Purchases, and Scrap Requests */}
      <Tabs defaultValue="maintenance" className="w-full  ">
        <TabsList className='grid w-full grid-cols-2 md:grid-cols-5 max-sm:grid-cols-2 max-sm:my-10'>
          <TabsTrigger value="maintenance" className="flex items-center gap-2 ">
            <Settings className="h-4 w-4" />  
            Maintenance ({filteredRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase ({filteredRequisitions.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Assets ({filteredAssetRequests.filter(req => req.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="grocery" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Stationary ({groceryRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="scrap" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Scrap ({filteredScrapRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 ">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setMaintenanceStatusFilter('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All maintenance requests
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setMaintenanceStatusFilter('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Requires your review
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setMaintenanceStatusFilter('approved')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% approved` : 'No approvals yet'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setMaintenanceStatusFilter('rejected')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rejected > 0 ? 'Rejected requests' : 'No rejections'}
            </p>
          </CardContent>
        </Card>
          </div>

          {/* Requests Table */}
          <Card>
        <CardHeader>
          <CardTitle>All Maintenance Requests</CardTitle>
          <CardDescription>
            Review and manage maintenance requests from all staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                No maintenance requests have been submitted yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Workstation</TableHead>
                    <TableHead>Running Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request, index) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewRequest(request)}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">{request.staff?.name || 'Unknown'}</TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>{request.serial_number || '-'}</TableCell>
                      <TableCell>{request.brand_name || '-'}</TableCell>
                      <TableCell>{request.workstation_number || '-'}</TableCell>
                      <TableCell>{getRunningStatusBadge(request.running_status)}</TableCell>
                      <TableCell className="max-w-xs">
                        {request.admin_notes ? (
                          <div className="truncate" title={request.admin_notes}>
                            <span className="text-sm text-muted-foreground">{request.admin_notes}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DownloadMaintenancePDF request={request} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {filteredRequests.length > 0 && (
            <TablePagination
              totalItems={filteredRequests.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(newRowsPerPage) => {
                setRowsPerPage(newRowsPerPage);
                setCurrentPage(1);
              }}
              itemLabel="requests"
            />
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6 space-y-6">
          {/* Purchase Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setPurchaseStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All purchase requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setPurchaseStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{purchaseStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Requires your review
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setPurchaseStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{purchaseStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.approved > 0 ? `${Math.round((purchaseStats.approved / purchaseStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setPurchaseStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{purchaseStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.rejected > 0 ? 'Rejected requisitions' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Requisitions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requisitions</CardTitle>
              <CardDescription>
                Review and approve purchase requisitions from staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPurchaseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : requisitions.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No requisitions found</h3>
                  <p className="text-muted-foreground">
                    No purchase requisitions have been submitted yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Purchase Item</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Download</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRequisitions.map((req, index) => (
                        <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPurchase(req)}>
                          <TableCell>{purchaseStartIndex + index + 1}</TableCell>
                          <TableCell>{format(new Date(req.requested_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{req.staff?.name || 'Unknown'}</TableCell>
                          <TableCell>{req.designation}</TableCell>
                          <TableCell>{req.branch}</TableCell>
                          <TableCell>{req.purchase_item}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DownloadPurchasePDF requisition={req} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {req.status === 'awaiting_final_verification' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPurchaseForVerify(req);
                                  setIsVerifyDialogOpen(true);
                                }}
                                disabled={isVerifying}
                              >
                                Verify Product
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredRequisitions.length > 0 && (
                <TablePagination
                  totalItems={filteredRequisitions.length}
                  currentPage={purchaseCurrentPage}
                  rowsPerPage={purchaseRowsPerPage}
                  onPageChange={setPurchaseCurrentPage}
                  onRowsPerPageChange={(newRowsPerPage) => {
                    setPurchaseRowsPerPage(newRowsPerPage);
                    setPurchaseCurrentPage(1);
                  }}
                  itemLabel="requisitions"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scrap" className="mt-6 space-y-6">
          {/* Scrap Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${scrapStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setScrapStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scrap Requests</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scrapStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All scrap requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${scrapStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setScrapStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{scrapStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Requires your review
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${scrapStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setScrapStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{scrapStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {scrapStats.approved > 0 ? `${Math.round((scrapStats.approved / scrapStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${scrapStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setScrapStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{scrapStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {scrapStats.rejected > 0 ? 'Rejected requests' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Scrap Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Scrap Requests</CardTitle>
              <CardDescription>
                Review and approve scrap requests from staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isScrapLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : scrapRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No scrap requests found</h3>
                  <p className="text-muted-foreground">
                    No scrap requests have been submitted yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Brand Name</TableHead>
                        <TableHead>Workstation</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Scrap Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Download</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedScrapRequests.map((request, index) => (
                        <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewScrap(request)}>
                          <TableCell>{scrapStartIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{request.staff?.name || 'Unknown'}</TableCell>
                          <TableCell>{request.branch}</TableCell>
                          <TableCell>{request.brand_name}</TableCell>
                          <TableCell>{request.workstation_number}</TableCell>
                          <TableCell>{request.serial_number}</TableCell>
                          <TableCell>
                            {request.scrap_status === 'working' && <Badge className="bg-green-100 text-green-800">Working</Badge>}
                            {request.scrap_status === 'damaged' && <Badge className="bg-orange-100 text-orange-800">Damaged</Badge>}
                            {request.scrap_status === 'beyond_repair' && <Badge className="bg-red-100 text-red-800">Beyond Repair</Badge>}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DownloadScrapPDF request={request} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredScrapRequests.length > 0 && (
                <TablePagination
                  totalItems={filteredScrapRequests.length}
                  currentPage={scrapCurrentPage}
                  rowsPerPage={scrapRowsPerPage}
                  onPageChange={setScrapCurrentPage}
                  onRowsPerPageChange={(newRowsPerPage) => {
                    setScrapRowsPerPage(newRowsPerPage);
                    setScrapCurrentPage(1);
                  }}
                  itemLabel="requests"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-6 space-y-6">
          {/* Asset Request Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setAssetStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Asset Requests</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  All asset requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setAssetStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{assetRequests.filter(req => req.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">
                  Requires your review
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setAssetStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{assetRequests.filter(req => req.status === 'approved').length}</div>
                <p className="text-xs text-muted-foreground">
                  {assetRequests.filter(req => req.status === 'approved').length > 0 ? 
                    `${Math.round((assetRequests.filter(req => req.status === 'approved').length / assetRequests.length) * 100)}% approved` : 
                    'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setAssetStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{assetRequests.filter(req => req.status === 'rejected').length}</div>
                <p className="text-xs text-muted-foreground">
                  {assetRequests.filter(req => req.status === 'rejected').length > 0 ? 'Rejected requests' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Requests</CardTitle>
              <CardDescription>
                Review and approve asset requests from staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAssetLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <AssetRequestsTable 
                    assetRequests={paginatedAssetRequests} 
                    isLoading={false}
                    startIndex={assetStartIndex}
                  />
                  {/* Pagination Controls */}
                  {filteredAssetRequests.length > 0 && (
                    <TablePagination
                      totalItems={filteredAssetRequests.length}
                      currentPage={assetCurrentPage}
                      rowsPerPage={assetRowsPerPage}
                      onPageChange={setAssetCurrentPage}
                      onRowsPerPageChange={(newRowsPerPage) => {
                        setAssetRowsPerPage(newRowsPerPage);
                        setAssetCurrentPage(1);
                      }}
                      itemLabel="requests"
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grocery" className="mt-6 space-y-6">
          {/* Grocery Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setGroceryStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stationary Requests</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groceryStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All stationary requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setGroceryStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{groceryStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Requires your review
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setGroceryStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{groceryStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {groceryStats.approved > 0 ? `${Math.round((groceryStats.approved / groceryStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setGroceryStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{groceryStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {groceryStats.rejected > 0 ? 'Rejected requests' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stationary Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stationary Requests</CardTitle>
              <CardDescription>
                Review and manage stationary requests from staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGroceryLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <GroceryReportTable
                  groceryRequests={groceryRequests.filter((r) => {
                    if (groceryStatusFilter !== 'all' && r.status !== groceryStatusFilter) return false;
                    return true;
                  })}
                  onViewDetails={(request) => {
                    setSelectedGrocery(request);
                    setIsGroceryDialogOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialogs */}
      {selectedRequest && (
        <MaintenanceApprovalDialog
          request={selectedRequest}
          isOpen={isDialogOpen}
          onOpenChange={handleCloseDialog}
        />
      )}

      {selectedPurchase && (
        <PurchaseApprovalDialog
          requisition={selectedPurchase}
          isOpen={isPurchaseDialogOpen}
          onOpenChange={handleClosePurchaseDialog}
        />
      )}

      {selectedScrap && (
        <ScrapApprovalDialog
          request={selectedScrap}
          open={isScrapDialogOpen}
          onOpenChange={setIsScrapDialogOpen}
        />
      )}

      {selectedGrocery && (
        <GroceryApprovalDialog
          request={selectedGrocery}
          open={isGroceryDialogOpen}
          onOpenChange={setIsGroceryDialogOpen}
        />
      )}

      {selectedPurchaseForVerify && (
        <VerifyProductDialog
          requisition={selectedPurchaseForVerify}
          isOpen={isVerifyDialogOpen}
          onOpenChange={setIsVerifyDialogOpen}
          onVerify={handleVerifyProduct}
          isVerifying={isVerifying}
        />
      )}
    </div>
  );
}

