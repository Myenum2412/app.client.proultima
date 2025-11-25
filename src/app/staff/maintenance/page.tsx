'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { useAssetRequests } from '@/hooks/use-asset-requests';
import { useGroceryRequests } from '@/hooks/use-grocery-requests';
import { createClient } from '@/lib/supabase/client';
import { MaintenanceFormDrawer } from '@/components/maintenance/maintenance-form-drawer';
import { MaintenanceDetailsDialog } from '@/components/maintenance/maintenance-details-dialog';
import { PurchaseRequisitionDrawer } from '@/components/maintenance/purchase-requisition-drawer';
import { PurchaseRequisitionViewDialog } from '@/components/staff/purchase-requisition-view-dialog';
import { AddScrapDrawer } from '@/components/staff/add-scrap-drawer';
import { AddAssetDrawer } from '@/components/staff/add-asset-drawer';
import { AddGroceryDrawer } from '@/components/staff/add-grocery-drawer';
import { AssetRequestsTable } from '@/components/staff/asset-requests-table';
import { MoveAssetToScrapDrawer } from '@/components/staff/move-asset-to-scrap-drawer';
import { MoveAssetToMaintenanceDialog } from '@/components/staff/move-asset-to-maintenance-dialog';
import { EditPurchaseDrawer } from '@/components/staff/edit-purchase-drawer';
import { EditScrapDrawer } from '@/components/staff/edit-scrap-drawer';
import { EditAssetDrawer } from '@/components/staff/edit-asset-drawer';
import { EditGroceryDrawer } from '@/components/staff/edit-grocery-drawer';
import { GroceryDetailsDialog } from '@/components/staff/grocery-details-dialog';
import { DownloadMaintenancePDF } from '@/components/maintenance/download-maintenance-pdf';
import { DownloadPurchasePDF } from '@/components/purchase/download-purchase-pdf';
import { DownloadScrapPDF } from '@/components/scrap/download-scrap-pdf';
import { UploadProductDialog } from '@/components/purchase/upload-product-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingCart, Settings, Package, Monitor, Pencil, MoreVertical, Eye, Trash2, ShoppingBag, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TablePagination } from '@/components/ui/table-pagination';
import type { MaintenanceRequest, PurchaseRequisition } from '@/types/maintenance';
import type { ScrapRequest } from '@/types/scrap';
import type { GroceryRequest } from '@/types';

export default function StaffMaintenancePage() {
  const { user } = useAuth();
  const { requests, isLoading, createRequest, updateRequest, deleteRequest, isCreating, isUpdating, isDeleting } = useMaintenanceRequests(user?.staffId);
  const { requisitions: myPurchases, isLoading: isPurchaseLoading, createRequisition, deleteRequisition, uploadProduct, isCreating: isPurchaseCreating, isDeleting: isPurchaseDeleting, isUploading } = usePurchaseRequisitions(user?.staffId);
  const { scrapRequests, isLoading: isScrapLoading, createScrapRequest, staffDeleteScrapRequest, isStaffDeleting } = useScrapRequests();
  const { assetRequests, isLoading: isAssetLoading, createAssetRequest, staffDeleteAssetRequest, isStaffDeleting: isAssetDeleting, refetch: refetchAssets } = useAssetRequests(user?.staffId);
  const { groceryRequests, isLoading: isGroceryLoading, createGroceryRequest, updateGroceryRequest, deleteGroceryRequest, isCreating: isGroceryCreating, isUpdating: isGroceryUpdating, isDeleting: isGroceryDeleting, stats: groceryStats } = useGroceryRequests(user?.staffId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequisition | null>(null);
  const [isPurchaseDetailsOpen, setIsPurchaseDetailsOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRequest | null>(null);
  const [isMaintenanceDetailsOpen, setIsMaintenanceDetailsOpen] = useState(false);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<any>(null);
  const [isMoveToMaintenanceOpen, setIsMoveToMaintenanceOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scrapStatusFilter, setScrapStatusFilter] = useState<string>('all');
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<string>('all');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('all');
  const [groceryStatusFilter, setGroceryStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('maintenance');
  
  // Edit states
  const [editPurchase, setEditPurchase] = useState<PurchaseRequisition | null>(null);
  const [isEditPurchaseOpen, setIsEditPurchaseOpen] = useState(false);
  const [editScrap, setEditScrap] = useState<any>(null);
  const [isEditScrapOpen, setIsEditScrapOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [editGrocery, setEditGrocery] = useState<GroceryRequest | null>(null);
  const [isEditGroceryOpen, setIsEditGroceryOpen] = useState(false);
  
  // Upload product dialog state
  const [selectedPurchaseForUpload, setSelectedPurchaseForUpload] = useState<PurchaseRequisition | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Add drawer states
  const [isAddScrapOpen, setIsAddScrapOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddGroceryOpen, setIsAddGroceryOpen] = useState(false);
  
  // Move asset to scrap drawer state
  const [isMoveToScrapOpen, setIsMoveToScrapOpen] = useState(false);
  const [selectedAssetForScrap, setSelectedAssetForScrap] = useState<any>(null);
  
  // View states
  const [selectedGrocery, setSelectedGrocery] = useState<GroceryRequest | null>(null);
  const [isGroceryDetailsOpen, setIsGroceryDetailsOpen] = useState(false);
  
  // Delete confirmation states
  const [deleteType, setDeleteType] = useState<'maintenance' | 'purchase' | 'scrap' | 'asset' | 'grocery' | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Pagination states for all tables
  const [maintenanceCurrentPage, setMaintenanceCurrentPage] = useState(1);
  const [maintenanceRowsPerPage, setMaintenanceRowsPerPage] = useState(10);
  
  const [purchaseCurrentPage, setPurchaseCurrentPage] = useState(1);
  const [purchaseRowsPerPage, setPurchaseRowsPerPage] = useState(10);
  
  const [scrapCurrentPage, setScrapCurrentPage] = useState(1);
  const [scrapRowsPerPage, setScrapRowsPerPage] = useState(10);
  
  const [assetCurrentPage, setAssetCurrentPage] = useState(1);
  const [assetRowsPerPage, setAssetRowsPerPage] = useState(10);
  
  const [groceryCurrentPage, setGroceryCurrentPage] = useState(1);
  const [groceryRowsPerPage, setGroceryRowsPerPage] = useState(10);

  // Calculate stats for maintenance
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  // Calculate stats for purchases
  const purchaseStats = {
    total: myPurchases.length,
    pending: myPurchases.filter(r => r.status === 'pending').length,
    approved: myPurchases.filter(r => r.status === 'approved').length,
    rejected: myPurchases.filter(r => r.status === 'rejected').length,
  };

  // Filter scrap requests for current staff
  const myScrapRequests = scrapRequests.filter((r: any) => {
    return r.staff_id === user?.staffId || r.admin_submitter_id === user?.id;
  });

  // Calculate stats for scrap
  const scrapStats = {
    total: myScrapRequests.length,
    pending: myScrapRequests.filter((r: any) => r.status === 'pending').length,
    approved: myScrapRequests.filter((r: any) => r.status === 'approved').length,
    rejected: myScrapRequests.filter((r: any) => r.status === 'rejected').length,
  };

  // Filtered scrap requests
  const filteredScrapRequests = myScrapRequests.filter((request: any) => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesScrapStatus =
      scrapStatusFilter === 'all' || request.scrap_status === scrapStatusFilter;
    return matchesStatus && matchesScrapStatus;
  });

  // Filtered maintenance requests
  const filteredMaintenanceRequests = requests.filter((request) => {
    if (maintenanceStatusFilter === 'all') return true;
    return request.status === maintenanceStatusFilter;
  });

  // Filtered purchase requisitions
  const filteredPurchases = myPurchases.filter((request) => {
    if (purchaseStatusFilter === 'all') return true;
    return request.status === purchaseStatusFilter;
  });

  // Filtered asset requests
  const filteredAssetRequests = assetRequests.filter((request) => {
    if (assetStatusFilter === 'all') return true;
    return request.status === assetStatusFilter;
  });

  // Filtered grocery requests
  const filteredGroceryRequests = groceryRequests.filter((request) => {
    if (groceryStatusFilter === 'all') return true;
    return request.status === groceryStatusFilter;
  });

  // Pagination logic for maintenance requests
  const maintenanceStartIndex = (maintenanceCurrentPage - 1) * maintenanceRowsPerPage;
  const maintenanceEndIndex = maintenanceStartIndex + maintenanceRowsPerPage;
  const paginatedMaintenanceRequests = filteredMaintenanceRequests.slice(maintenanceStartIndex, maintenanceEndIndex);

  // Pagination logic for purchase requisitions
  const purchaseStartIndex = (purchaseCurrentPage - 1) * purchaseRowsPerPage;
  const purchaseEndIndex = purchaseStartIndex + purchaseRowsPerPage;
  const paginatedPurchases = filteredPurchases.slice(purchaseStartIndex, purchaseEndIndex);

  // Pagination logic for scrap requests
  const scrapStartIndex = (scrapCurrentPage - 1) * scrapRowsPerPage;
  const scrapEndIndex = scrapStartIndex + scrapRowsPerPage;
  const paginatedScrapRequests = filteredScrapRequests.slice(scrapStartIndex, scrapEndIndex);

  // Pagination logic for asset requests
  const assetStartIndex = (assetCurrentPage - 1) * assetRowsPerPage;
  const assetEndIndex = assetStartIndex + assetRowsPerPage;
  const paginatedAssetRequests = filteredAssetRequests.slice(assetStartIndex, assetEndIndex);

  // Pagination logic for grocery requests
  const groceryStartIndex = (groceryCurrentPage - 1) * groceryRowsPerPage;
  const groceryEndIndex = groceryStartIndex + groceryRowsPerPage;
  const paginatedGroceryRequests = filteredGroceryRequests.slice(groceryStartIndex, groceryEndIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setScrapCurrentPage(1);
  }, [statusFilter, scrapStatusFilter]);

  useEffect(() => {
    setMaintenanceCurrentPage(1);
  }, [maintenanceStatusFilter]);

  useEffect(() => {
    setPurchaseCurrentPage(1);
  }, [purchaseStatusFilter]);

  useEffect(() => {
    setAssetCurrentPage(1);
  }, [assetStatusFilter]);

  useEffect(() => {
    setGroceryCurrentPage(1);
  }, [groceryStatusFilter]);

  const handleOpenForm = (request?: MaintenanceRequest) => {
    setEditingRequest(request || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = (data: any) => {
    if (editingRequest) {
      updateRequest({ id: editingRequest.id, formData: data });
    } else {
      createRequest(data);
    }
    handleCloseForm();
  };

  const handlePurchaseSubmit = (data: any) => {
    createRequisition(data, {
      onSuccess: () => {
        setIsPurchaseDialogOpen(false);
      },
    });
  };

  const handleAddScrap = (data: any) => {
    createScrapRequest.mutate(data, {
      onSuccess: () => {
        setIsAddScrapOpen(false);
      },
    });
  };

  // Handler to open move to maintenance dialog
  const handleMoveAssetToMaintenance = (assetRequest: any) => {
    setSelectedAssetForMaintenance(assetRequest);
    setIsMoveToMaintenanceOpen(true);
  };

  // Handler to submit maintenance request with running status and remarks
  const handleSubmitMaintenanceRequest = async (data: {
    running_status: 'running' | 'not_running';
    remarks: string;
  }) => {
    if (!selectedAssetForMaintenance) {
      toast.error('Asset information is missing');
      return;
    }

    try {
      // Convert asset request to maintenance request format
      const currentDate = new Date();
      // Format report_month as full date (first day of current month) - database expects date format
      const reportMonth = format(currentDate, 'yyyy-MM-01');
      
      // Map asset condition to maintenance condition
      let condition: 'new' | 'used' = 'new';
      if (selectedAssetForMaintenance.condition === 'used' || selectedAssetForMaintenance.condition === 'refurbished') {
        condition = 'used';
      }
      
      const maintenanceData = {
        staff_id: user?.staffId || selectedAssetForMaintenance.staff_id,
        branch: selectedAssetForMaintenance.branch,
        brand_name: selectedAssetForMaintenance.brand_name || selectedAssetForMaintenance.product_name,
        serial_number: selectedAssetForMaintenance.serial_no || undefined,
        workstation_number: (selectedAssetForMaintenance as any).workstation || undefined,
        report_month: reportMonth,
        condition: condition,
        running_status: data.running_status,
        attachment_urls: selectedAssetForMaintenance.image_urls || undefined,
        contact_name: undefined,
        contact_number: undefined,
        date_of_purchase: undefined,
        warranty_end_date: undefined,
        // Store remarks in admin_notes so it's visible to admin
        // This will be shown in admin panel for review
        admin_notes: data.remarks,
      };
      
      await createRequest(maintenanceData);
      
      toast.success('Asset request moved to maintenance successfully', {
        description: 'The maintenance request has been created and will appear in the admin panel for review.',
      });

      // Reset state
      setSelectedAssetForMaintenance(null);
    } catch (error: any) {
      console.error('Error moving asset to maintenance:', error);
      toast.error('Failed to move asset to maintenance', {
        description: error?.message || 'An unexpected error occurred.',
      });
      throw error; // Re-throw to let the dialog handle it
    }
  };

  const handleAddAsset = async (data: any) => {
    await createAssetRequest(data);
    setIsAddAssetOpen(false);
    // Force refetch to ensure the new request appears immediately
    setTimeout(() => {
      refetchAssets();
    }, 500);
  };

  const handleAddGrocery = (data: any) => {
    createGroceryRequest(data, {
      onSuccess: () => {
        setIsAddGroceryOpen(false);
      },
    });
  };

  const handleMoveToScrap = (data: any) => {
    createScrapRequest.mutate(data, {
      onSuccess: () => {
        setIsMoveToScrapOpen(false);
        setSelectedAssetForScrap(null);
      },
    });
  };

  const handleUploadProduct = (productData: { 
    request_type: 'system' | 'common';
    product_name: string;
    brand_name: string;
    serial_no?: string;
    warranty?: string;
    condition: 'new' | '2nd_hand' | 'used';
    user_name: string;
    remote_id?: string;
    specification?: string;
    product_image_urls: string[];
    shop_contact?: string;
    quantity: number;
    price: number;
  }) => {
    if (!selectedPurchaseForUpload) return;
    
    uploadProduct({
      id: selectedPurchaseForUpload.id,
      request_type: productData.request_type,
      product_name: productData.product_name,
      brand_name: productData.brand_name,
      serial_no: productData.serial_no,
      warranty: productData.warranty,
      condition: productData.condition,
      user_name: productData.user_name,
      remote_id: productData.remote_id,
      specification: productData.specification,
      product_image_urls: productData.product_image_urls,
      shop_contact: productData.shop_contact,
      quantity: productData.quantity,
      price: productData.price,
    });
    
    setIsUploadDialogOpen(false);
    setSelectedPurchaseForUpload(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'verification_pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />Waiting for Product Upload</Badge>;
      case 'awaiting_final_verification':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completed ✓</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
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

  const getScrapStatusBadge = (scrapStatus: string) => {
    const variants: Record<string, string> = {
      working: 'bg-blue-100 text-blue-800',
      damaged: 'bg-yellow-100 text-yellow-800',
      beyond_repair: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      working: 'Working',
      damaged: 'Damaged',
      beyond_repair: 'Beyond Repair',
    };
    return (
      <Badge variant="outline" className={variants[scrapStatus] || ''}>
        {labels[scrapStatus] || scrapStatus}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance, Purchase & Scrap Requests</h1>
          <p className="text-muted-foreground">
            Track and manage your maintenance, purchase, and scrap requests
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'maintenance' && (
            <Button onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add System Record
            </Button>
          )}
          {activeTab === 'purchases' && (
            <Button  onClick={() => setIsPurchaseDialogOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Product
            </Button>
          )}
          {activeTab === 'scrap' && (
            <Button  onClick={() => setIsAddScrapOpen(true)}>
              <Package className="mr-2 h-4 w-4" />
              Add Scrap
            </Button>
          )}
          {activeTab === 'assets' && (
            <Button  onClick={() => setIsAddAssetOpen(true)}>
              <Monitor className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          )}
          {activeTab === 'grocery' && (
            <Button  onClick={() => setIsAddGroceryOpen(true)}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add Stationary
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Maintenance, Purchases, and Scrap */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-2">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Maintenance ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase ({purchaseStats.pending})
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Assets ({assetRequests.filter(req => req.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="grocery" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Stationary ({groceryStats.pending})
          </TabsTrigger>
          <TabsTrigger value="scrap" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Scrap ({scrapStats.pending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-6 space-y-6 max-sm:mt-16">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 ">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setMaintenanceStatusFilter('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Systems</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total} system entries
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setMaintenanceStatusFilter('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`bg-green-100 cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setMaintenanceStatusFilter('approved')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0  pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approved > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% approved` : 'No approvals yet'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`bg-red-100 cursor-pointer transition-all hover:shadow-md ${maintenanceStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setMaintenanceStatusFilter('rejected')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rejected > 0 ? 'Requires attention' : 'No rejections'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Records</CardTitle>
          <CardDescription>
            View and manage all your system maintenance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredMaintenanceRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {maintenanceStatusFilter === 'all' ? 'No systems found' : `No ${maintenanceStatusFilter} systems found`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {maintenanceStatusFilter === 'all' 
                  ? 'Add your first system record to get started'
                  : `There are no ${maintenanceStatusFilter} system records at the moment.`}
              </p>
              {maintenanceStatusFilter === 'all' && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add System Record
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Workstation</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Running Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMaintenanceRequests.map((request, index) => (
                    <TableRow 
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedMaintenance(request);
                        setIsMaintenanceDetailsOpen(true);
                      }}
                    >
                      <TableCell>{maintenanceStartIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">{request.serial_number || '-'}</TableCell>
                      <TableCell>{request.brand_name || '-'}</TableCell>
                      <TableCell>{request.workstation_number || '-'}</TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{request.condition}</Badge>
                      </TableCell>
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
                        <div className="flex items-center gap-2 justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenForm(request);
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteType('maintenance');
                                  setDeleteId(request.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DownloadMaintenancePDF request={request} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {filteredMaintenanceRequests.length > 0 && (
            <TablePagination
              totalItems={filteredMaintenanceRequests.length}
              currentPage={maintenanceCurrentPage}
              rowsPerPage={maintenanceRowsPerPage}
              onPageChange={setMaintenanceCurrentPage}
              onRowsPerPageChange={(newRowsPerPage) => {
                setMaintenanceRowsPerPage(newRowsPerPage);
                setMaintenanceCurrentPage(1);
              }}
              itemLabel="records"
            />
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6 space-y-6 max-sm:mt-16">
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
                  {purchaseStats.total} purchase requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setPurchaseStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-green-100 cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setPurchaseStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.approved > 0 ? `${Math.round((purchaseStats.approved / purchaseStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-red-100 cursor-pointer transition-all hover:shadow-md ${purchaseStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setPurchaseStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {purchaseStats.rejected > 0 ? 'Requires attention' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Requisitions Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Purchase Requisitions</CardTitle>
              <CardDescription>
                View all your submitted purchase requisitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPurchaseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {purchaseStatusFilter === 'all' ? 'No requisitions yet' : `No ${purchaseStatusFilter} requisitions found`}
                  </h3>
                  <p className="text-muted-foreground">
                    {purchaseStatusFilter === 'all' 
                      ? "You haven't submitted any purchase requisitions yet"
                      : `There are no ${purchaseStatusFilter} purchase requisitions at the moment.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Purchase Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin Response</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPurchases.map((req, index) => (
                        <TableRow 
                          key={req.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedPurchase(req);
                            setIsPurchaseDetailsOpen(true);
                          }}
                        >
                          <TableCell>{purchaseStartIndex + index + 1}</TableCell>
                          <TableCell>{format(new Date(req.requested_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-medium">{req.purchase_item}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.description || '-'}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell className="max-w-xs">
                            {req.admin_notes && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Notes: </span>
                                {req.admin_notes}
                              </div>
                            )}
                            {req.rejection_reason && (
                              <div className="text-sm text-red-600">
                                <span className="font-medium">Reason: </span>
                                {req.rejection_reason}
                              </div>
                            )}
                            {!req.admin_notes && !req.rejection_reason && '-'}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2 justify-end">
                              {req.status === 'verification_pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPurchaseForUpload(req);
                                    setIsUploadDialogOpen(true);
                                  }}
                                  disabled={isUploading}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload Product
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setEditPurchase(req);
                                    setIsEditPurchaseOpen(true);
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteType('purchase');
                                      setDeleteId(req.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <DownloadPurchasePDF requisition={req} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredPurchases.length > 0 && (
                <TablePagination
                  totalItems={filteredPurchases.length}
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

        <TabsContent value="scrap" className="mt-6 space-y-6 max-sm:mt-16">
          {/* Scrap Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scrapStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {scrapStats.total} scrap requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scrapStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-green-100 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scrapStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {scrapStats.approved > 0 ? `${Math.round((scrapStats.approved / scrapStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-red-100 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scrapStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {scrapStats.rejected > 0 ? 'Requires attention' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Scrap Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Scrap Requests</CardTitle>
              <CardDescription>
                View and track your submitted scrap requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={scrapStatusFilter} onValueChange={setScrapStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by scrap status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scrap Status</SelectItem>
                    <SelectItem value="working">Working</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isScrapLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredScrapRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No scrap requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">S.No</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Workstation</TableHead>
                        <TableHead>Serial No.</TableHead>
                        <TableHead>Scrap Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedScrapRequests.map((request: any, index: number) => (
                        <TableRow key={request.id}>
                          <TableCell>{scrapStartIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">{request.brand_name}</TableCell>
                          <TableCell>{request.workstation_number}</TableCell>
                          <TableCell>{request.serial_number}</TableCell>
                          <TableCell>{getScrapStatusBadge(request.scrap_status)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {format(new Date(request.requested_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditScrap(request);
                                    setIsEditScrapOpen(true);
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setDeleteType('scrap');
                                      setDeleteId(request.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <DownloadScrapPDF request={request} />
                            </div>
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

        <TabsContent value="assets" className="mt-6 space-y-6 max-sm:mt-16">
          {/* Asset Request Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setAssetStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {assetRequests.length} asset requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setAssetStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetRequests.filter(req => req.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-green-100 cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setAssetStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetRequests.filter(req => req.status === 'approved').length}</div>
                <p className="text-xs text-muted-foreground">
                  {assetRequests.filter(req => req.status === 'approved').length > 0 ? 
                    `${Math.round((assetRequests.filter(req => req.status === 'approved').length / assetRequests.length) * 100)}% approved` : 
                    'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-red-100 cursor-pointer transition-all hover:shadow-md ${assetStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setAssetStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetRequests.filter(req => req.status === 'rejected').length}</div>
                <p className="text-xs text-muted-foreground">
                  {assetRequests.filter(req => req.status === 'rejected').length > 0 ? 'Requires attention' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Asset Requests</CardTitle>
              <CardDescription>
                View and track your submitted asset requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAssetLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredAssetRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {assetStatusFilter === 'all' ? 'No asset requests yet' : `No ${assetStatusFilter} asset requests found`}
                  </h3>
                  <p className="text-muted-foreground">
                    {assetStatusFilter === 'all' 
                      ? "You haven't submitted any asset requests yet"
                      : `There are no ${assetStatusFilter} asset requests at the moment.`}
                  </p>
                </div>
              ) : (
                <>
                  <AssetRequestsTable 
                    assetRequests={paginatedAssetRequests} 
                    isLoading={isAssetLoading}
                    startIndex={assetStartIndex}
                    onEditRequest={(request) => {
                      setEditAsset(request);
                      setIsEditAssetOpen(true);
                    }}
                    onDeleteRequest={(id) => {
                      setDeleteType('asset');
                      setDeleteId(id);
                      setIsDeleteDialogOpen(true);
                    }}
                    onMoveToScrap={(request) => {
                      setSelectedAssetForScrap(request);
                      setIsMoveToScrapOpen(true);
                    }}
                    onMoveToMaintenance={handleMoveAssetToMaintenance}
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

        <TabsContent value="grocery" className="mt-6 space-y-6 max-sm:mt-16">
          {/* Grocery Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setGroceryStatusFilter('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groceryStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {groceryStats.total} stationary requests
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setGroceryStatusFilter('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groceryStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-green-100 cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setGroceryStatusFilter('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groceryStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {groceryStats.approved > 0 ? `${Math.round((groceryStats.approved / groceryStats.total) * 100)}% approved` : 'No approvals yet'}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-red-100 cursor-pointer transition-all hover:shadow-md ${groceryStatusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setGroceryStatusFilter('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groceryStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {groceryStats.rejected > 0 ? 'Requires attention' : 'No rejections'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grocery Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Stationary Requests</CardTitle>
              <CardDescription>
                View and track your submitted stationary requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGroceryLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredGroceryRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {groceryStatusFilter === 'all' ? 'No stationary requests found' : `No ${groceryStatusFilter} stationary requests found`}
                  </h3>
                  <p className="text-muted-foreground">
                    {groceryStatusFilter === 'all' 
                      ? 'No stationary requests match the current filters'
                      : `There are no ${groceryStatusFilter} stationary requests at the moment.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">S.No</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGroceryRequests.map((request, index) => (
                        <TableRow 
                          key={request.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedGrocery(request);
                            setIsGroceryDetailsOpen(true);
                          }}
                        >
                          <TableCell>{groceryStartIndex + index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {request.items && request.items.length > 0 ? (
                              <div>
                                <div className="font-semibold">
                                  {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {request.items.slice(0, 2).map(item => item.item_name).join(', ')}
                                  {request.items.length > 2 && ` +${request.items.length - 2} more`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No items</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{(request.total_request_amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {format(new Date(request.requested_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setEditGrocery(request);
                                    setIsEditGroceryOpen(true);
                                  }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteType('grocery');
                                      setDeleteId(request.id);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredGroceryRequests.length > 0 && (
                <TablePagination
                  totalItems={filteredGroceryRequests.length}
                  currentPage={groceryCurrentPage}
                  rowsPerPage={groceryRowsPerPage}
                  onPageChange={setGroceryCurrentPage}
                  onRowsPerPageChange={(newRowsPerPage) => {
                    setGroceryRowsPerPage(newRowsPerPage);
                    setGroceryCurrentPage(1);
                  }}
                  itemLabel="requests"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialogs */}
      <MaintenanceFormDrawer
        isOpen={isFormOpen}
        onOpenChange={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={editingRequest}
        isSubmitting={isCreating || isUpdating}
      />

      <PurchaseRequisitionDrawer
        isOpen={isPurchaseDialogOpen}
        onOpenChange={setIsPurchaseDialogOpen}
        onSubmit={handlePurchaseSubmit}
        isSubmitting={isPurchaseCreating}
      />

      {/* Maintenance Details Dialog */}
      <MaintenanceDetailsDialog
        request={selectedMaintenance}
        open={isMaintenanceDetailsOpen}
        onOpenChange={setIsMaintenanceDetailsOpen}
      />

      {/* Purchase Details Dialog (view-only for staff) */}
      {selectedPurchase && (
        <PurchaseRequisitionViewDialog
          requisition={selectedPurchase}
          isOpen={isPurchaseDetailsOpen}
          onOpenChange={setIsPurchaseDetailsOpen}
        />
      )}

      {/* Edit Drawers */}
      <EditPurchaseDrawer
        requisition={editPurchase}
        isOpen={isEditPurchaseOpen}
        onOpenChange={setIsEditPurchaseOpen}
      />

      <EditScrapDrawer
        scrapRequest={editScrap}
        isOpen={isEditScrapOpen}
        onOpenChange={setIsEditScrapOpen}
      />

      <EditAssetDrawer
        assetRequest={editAsset}
        isOpen={isEditAssetOpen}
        onOpenChange={setIsEditAssetOpen}
      />

      {/* Add Drawers */}
      <AddScrapDrawer
        isOpen={isAddScrapOpen}
        onOpenChange={setIsAddScrapOpen}
        onSubmit={handleAddScrap}
        isSubmitting={false}
      />

      <AddAssetDrawer
        isOpen={isAddAssetOpen}
        onOpenChange={setIsAddAssetOpen}
        onSubmit={handleAddAsset}
        isSubmitting={false}
      />

      <AddGroceryDrawer
        isOpen={isAddGroceryOpen}
        onOpenChange={setIsAddGroceryOpen}
        onSubmit={handleAddGrocery}
        isSubmitting={isGroceryCreating}
      />

      <EditGroceryDrawer
        groceryRequest={editGrocery}
        isOpen={isEditGroceryOpen}
        onClose={() => {
          setIsEditGroceryOpen(false);
          setEditGrocery(null);
        }}
        onSubmit={(id, data) => {
          updateGroceryRequest({ id, data }, {
            onSuccess: () => {
              setIsEditGroceryOpen(false);
              setEditGrocery(null);
            },
          });
        }}
        isSubmitting={isGroceryUpdating}
      />

      <GroceryDetailsDialog
        isOpen={isGroceryDetailsOpen}
        onClose={() => {
          setIsGroceryDetailsOpen(false);
          setSelectedGrocery(null);
        }}
        groceryRequest={selectedGrocery}
      />

      {/* Global Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteType === 'maintenance' ? 'System Record' : deleteType === 'purchase' ? 'Purchase Requisition' : deleteType === 'scrap' ? 'Scrap Request' : 'Asset Request'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this request from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId && deleteType) {
                  if (deleteType === 'maintenance') deleteRequest(deleteId);
                  if (deleteType === 'purchase') deleteRequisition(deleteId);
                  if (deleteType === 'scrap') staffDeleteScrapRequest(deleteId);
                  if (deleteType === 'asset') staffDeleteAssetRequest(deleteId);
                  if (deleteType === 'grocery') deleteGroceryRequest(deleteId);
                  setIsDeleteDialogOpen(false);
                  setDeleteId(null);
                  setDeleteType(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Product Dialog */}
      {selectedPurchaseForUpload && (
        <UploadProductDialog
          requisition={selectedPurchaseForUpload}
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUpload={handleUploadProduct}
          isUploading={isUploading}
          uploadImages={async (files: File[]) => {
            const supabase = createClient();
            const uploadedUrls: string[] = [];

            for (const file of files) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
              const filePath = `products/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('cash-receipts')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false,
                });

              if (uploadError) {
                console.error('Error uploading product image:', uploadError);
                throw new Error(`Failed to upload image: ${file.name}`);
              }

              const { data: { publicUrl } } = supabase.storage
                .from('cash-receipts')
                .getPublicUrl(filePath);

              uploadedUrls.push(publicUrl);
            }

            return uploadedUrls;
          }}
        />
      )}

      {/* Move Asset to Scrap Drawer */}
      <MoveAssetToScrapDrawer
        isOpen={isMoveToScrapOpen}
        onOpenChange={setIsMoveToScrapOpen}
        asset={selectedAssetForScrap}
        onSubmit={handleMoveToScrap}
        isSubmitting={createScrapRequest.isPending}
      />

      {/* Move Asset to Maintenance Dialog */}
      <MoveAssetToMaintenanceDialog
        isOpen={isMoveToMaintenanceOpen}
        onOpenChange={setIsMoveToMaintenanceOpen}
        asset={selectedAssetForMaintenance}
        onSubmit={handleSubmitMaintenanceRequest}
        isSubmitting={isCreating}
      />
    </div>
  );
}



