'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStaff } from '@/hooks/use-staff';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MaintenanceRequest, MaintenanceFormData, MaintenanceCondition, MaintenanceRunningStatus } from '@/types/maintenance';
import { format } from 'date-fns';
import { useCompletedPurchases } from '@/hooks/use-purchase-requisitions';
import { useAssetRequests } from '@/hooks/use-asset-requests';
import { getNextAssetNumber } from '@/lib/asset-number-utils';
import type { PurchaseRequisition } from '@/types/maintenance';
import type { AssetRequest } from '@/types/index';

interface MaintenanceFormDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MaintenanceFormData & { staff_id: string }) => void;
  initialData?: MaintenanceRequest | null;
  isSubmitting?: boolean;
}

export function MaintenanceFormDrawer({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting = false,
}: MaintenanceFormDrawerProps) {
  const { user } = useAuth();
  const { staff } = useStaff();
  const currentStaff = staff.find(s => s.id === user?.staffId);
  
  // Fetch completed purchases for pre-fill
  const { purchases: completedPurchases, isLoading: isLoadingPurchases } = useCompletedPurchases(user?.staffId);
  
  // Fetch approved asset requests for asset number selection
  // For admin users, show all approved assets; for staff, show only their own
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const { assetRequests } = useAssetRequests(isAdmin ? undefined : user?.staffId);
  const approvedAssets = assetRequests.filter(a => a.status === 'approved');
  
  // Selected purchase for pre-fill
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  
  // Asset number state
  const [assetNumber, setAssetNumber] = useState<string>('');
  const [isGeneratingAssetNumber, setIsGeneratingAssetNumber] = useState(false);
  
  // Date states for DatePicker components
  const [reportMonth, setReportMonth] = useState<Date>(new Date());
  const [dateOfPurchase, setDateOfPurchase] = useState<Date>();
  const [warrantyEndDate, setWarrantyEndDate] = useState<Date>();
  
  
  const [formData, setFormData] = useState<MaintenanceFormData>({
    asset_number: '',
    serial_number: '',
    workstation_number: '',
    brand_name: '',
    report_month: format(new Date(), 'yyyy-MM'),
    date_of_purchase: '',
    warranty_end_date: '',
    condition: 'new',
    running_status: 'running',
    branch: currentStaff?.branch || '',
    contact_name: '',
    contact_number: '',
    remarks: '',
  });

  // Auto-generate asset number when form opens for new record
  useEffect(() => {
    if (!initialData && isOpen) {
      setIsGeneratingAssetNumber(true);
      getNextAssetNumber()
        .then((nextNumber) => {
          setAssetNumber(nextNumber);
          setFormData((prev) => ({ ...prev, asset_number: nextNumber }));
        })
        .catch((error) => {
          console.error('Error generating asset number:', error);
          // Fallback to manual entry
        })
        .finally(() => {
          setIsGeneratingAssetNumber(false);
        });
    }
  }, [isOpen, initialData]);

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      setAssetNumber(initialData.asset_number || '');
      setFormData({
        asset_number: initialData.asset_number || '',
        serial_number: initialData.serial_number || '',
        workstation_number: initialData.workstation_number || '',
        brand_name: initialData.brand_name || '',
        report_month: initialData.report_month || format(new Date(), 'yyyy-MM'),
        date_of_purchase: initialData.date_of_purchase || '',
        warranty_end_date: initialData.warranty_end_date || '',
        condition: initialData.condition,
        running_status: initialData.running_status,
        branch: initialData.branch,
        contact_name: initialData.contact_name || '',
        contact_number: initialData.contact_number || '',
        remarks: initialData.admin_notes || '',
      });
      
      // Set date states for DatePicker components
      setReportMonth(initialData.report_month ? new Date(initialData.report_month) : new Date());
      setDateOfPurchase(initialData.date_of_purchase ? new Date(initialData.date_of_purchase) : undefined);
      setWarrantyEndDate(initialData.warranty_end_date ? new Date(initialData.warranty_end_date) : undefined);
    } else {
      // Reset form for new request
      setFormData({
        asset_number: assetNumber || '',
        serial_number: '',
        workstation_number: '',
        brand_name: '',
        report_month: format(new Date(), 'yyyy-MM'),
        date_of_purchase: '',
        warranty_end_date: '',
        condition: 'new',
        running_status: 'running',
        branch: currentStaff?.branch || '',
        contact_name: '',
        contact_number: '',
        remarks: '',
      });
      
      // Reset date states
      setReportMonth(new Date());
      setDateOfPurchase(undefined);
      setWarrantyEndDate(undefined);
      setSelectedPurchaseId('');
    }
  }, [initialData, currentStaff?.branch, assetNumber]);

  // Helper function to parse warranty date
  const parseWarrantyDate = (warranty: string | undefined): Date | undefined => {
    if (!warranty) return undefined;
    
    // Try parsing as ISO date string
    const isoDate = new Date(warranty);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    // Try parsing common date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];
    
    for (const format of dateFormats) {
      if (format.test(warranty.trim())) {
        const parsed = new Date(warranty);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    
    return undefined;
  };

  // Map purchase condition to maintenance condition
  const mapPurchaseCondition = (condition: 'new' | '2nd_hand' | 'used' | undefined): MaintenanceCondition => {
    if (!condition) return 'new';
    if (condition === '2nd_hand') return 'used';
    if (condition === 'new' || condition === 'used') return condition;
    return 'new';
  };

  // Handle asset number selection for auto-fill
  const handleAssetNumberSelect = (selectedAssetNumber: string) => {
    if (!selectedAssetNumber || selectedAssetNumber === 'none') {
      setAssetNumber('');
      setFormData((prev) => ({ ...prev, asset_number: '' }));
      return;
    }

    const selectedAsset = approvedAssets.find((a) => a.asset_number === selectedAssetNumber);
    if (!selectedAsset) {
      // If not found, just set the asset number
      setAssetNumber(selectedAssetNumber);
      setFormData((prev) => ({ ...prev, asset_number: selectedAssetNumber }));
      return;
    }

    setAssetNumber(selectedAssetNumber);

    // Auto-fill form fields from asset
    const updates: Partial<MaintenanceFormData> = {
      asset_number: selectedAssetNumber,
      serial_number: selectedAsset.serial_no || '',
      brand_name: selectedAsset.brand_name || '',
      condition: selectedAsset.condition === 'new' ? 'new' : 'used',
    };

    setFormData((prev) => ({ ...prev, ...updates }));

    // Handle warranty end date if available
    if (selectedAsset.warranty) {
      const warrantyDate = parseWarrantyDate(selectedAsset.warranty);
      if (warrantyDate) {
        setWarrantyEndDate(warrantyDate);
      }
    }
  };

  // Handle product selection for auto-fill
  const handleProductSelect = (purchaseId: string) => {
    if (!purchaseId) {
      setSelectedPurchaseId('');
      return;
    }

    const selectedPurchase = completedPurchases.find((p) => p.id === purchaseId);
    if (!selectedPurchase) return;

    setSelectedPurchaseId(purchaseId);

    // Auto-fill form fields
    const updates: Partial<MaintenanceFormData> = {
      serial_number: selectedPurchase.serial_no || '',
      brand_name: selectedPurchase.brand_name || '',
      contact_name: selectedPurchase.user_name || '',
      condition: mapPurchaseCondition(selectedPurchase.condition),
    };

    setFormData((prev) => ({ ...prev, ...updates }));

    // Handle date of purchase from approved_at
    if (selectedPurchase.approved_at) {
      const purchaseDate = new Date(selectedPurchase.approved_at);
      if (!isNaN(purchaseDate.getTime())) {
        setDateOfPurchase(purchaseDate);
      }
    }

    // Handle warranty end date
    const warrantyDate = parseWarrantyDate(selectedPurchase.warranty);
    if (warrantyDate) {
      setWarrantyEndDate(warrantyDate);
    } else {
      setWarrantyEndDate(undefined);
    }
  };

  // Reset auto-filled fields when selection is cleared
  const handleClearSelection = () => {
    setSelectedPurchaseId('');
    // Reset only auto-filled fields, keep user-entered values
    setFormData((prev) => ({
      ...prev,
      serial_number: '',
      brand_name: '',
      contact_name: '',
      condition: 'new',
    }));
    setDateOfPurchase(undefined);
    setWarrantyEndDate(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.staffId) {
      return;
    }

    // Convert Date objects to string format for database
    const reportMonthFormatted = format(reportMonth, "yyyy-MM-01");
    const dateOfPurchaseFormatted = dateOfPurchase ? format(dateOfPurchase, "yyyy-MM-dd") : undefined;
    const warrantyEndFormatted = warrantyEndDate ? format(warrantyEndDate, "yyyy-MM-dd") : undefined;

    // Extract remarks and store in admin_notes for database
    const { remarks, ...formDataWithoutRemarks } = formData;

    onSubmit({
      ...formDataWithoutRemarks,
      report_month: reportMonthFormatted,
      date_of_purchase: dateOfPurchaseFormatted,
      warranty_end_date: warrantyEndFormatted,
      // Store remarks in admin_notes field (for staff-submitted remarks)
      // Admin can add their own notes later which will append or replace this
      admin_notes: remarks || undefined,
      staff_id: user.staffId,
    } as MaintenanceFormData & { staff_id: string; admin_notes?: string });
  };


  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>{initialData ? 'Edit Maintenance Record' : 'Add New Maintenance Record'}</DrawerTitle>
          <DrawerDescription>
            {initialData ? 'Update maintenance record details' : 'Record maintenance details for system tracking'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Month */}
              <div className="space-y-2">
                <Label>Report Month</Label>
                <DatePicker
                  date={reportMonth}
                  onSelect={(date) => date && setReportMonth(date)}
                  placeholder="Select month"
                />
              </div>

              {/* Asset Number */}
              <div className="space-y-2">
                <Label htmlFor="asset_number">Asset Number</Label>
                {isGeneratingAssetNumber ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating asset number...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedAssets.length > 0 && (
                      <Select
                        value={assetNumber && approvedAssets.find(a => a.asset_number === assetNumber) ? assetNumber : 'none'}
                        onValueChange={handleAssetNumberSelect}
                      >
                        <SelectTrigger id="asset_number_select" className="w-full">
                          <SelectValue placeholder="Select from existing assets" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Manual Entry)</SelectItem>
                          {approvedAssets
                            .filter(a => a.asset_number)
                            .map((asset) => (
                              <SelectItem key={asset.id} value={asset.asset_number!}>
                                {asset.asset_number} - {asset.product_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      id="asset_number"
                      type="text"
                      placeholder="e.g., ASS001 (auto-generated)"
                      value={assetNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setAssetNumber(value);
                        setFormData((prev) => ({ ...prev, asset_number: value }));
                      }}
                      className={approvedAssets.length > 0 ? 'mt-2' : ''}
                    />
                    {assetNumber && !approvedAssets.find(a => a.asset_number === assetNumber) && (
                      <p className="text-xs text-muted-foreground">
                        Asset number will be created if it doesn't exist
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Existing Product Details (Optional) */}
              {!initialData && (
                <div className="space-y-2">
                  <Label htmlFor="existing_product">Existing Product Details (Optional)</Label>
                  {isLoadingPurchases ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading purchased products...
                    </div>
                  ) : completedPurchases.length > 0 ? (
                    <Select
                      value={selectedPurchaseId || undefined}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          handleClearSelection();
                        } else {
                          handleProductSelect(value);
                        }
                      }}
                      
                    >
                      <SelectTrigger id="existing_product" className="w-full justify-start">
                        <SelectValue placeholder="Select a purchased product to auto-fill details..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Fill manually)</SelectItem>
                        {completedPurchases.map((purchase) => (
                          <SelectItem key={purchase.id} value={purchase.id}>
                            {purchase.displayText}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No completed purchases available. Fill the form manually.
                    </p>
                  )}
                </div>
              )}

              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  type="text"
                  placeholder="e.g., Dell, HP, Lenovo"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                />
              </div>

              {/* Date of Purchase */}
              <div className="space-y-2">
                <Label>Date of Purchase</Label>
                <DatePicker
                  date={dateOfPurchase}
                  onSelect={setDateOfPurchase}
                  placeholder="Select purchase date"
                />
              </div>

              {/* Warranty End Date */}
              <div className="space-y-2">
                <Label>Warranty End Date</Label>
                <DatePicker
                  date={warrantyEndDate}
                  onSelect={setWarrantyEndDate}
                  placeholder="Select warranty end date"
                />
              </div>

              {/* Branch / Location */}
              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Location</Label>
                <Input
                  id="branch"
                  type="text"
                  placeholder="e.g., Main Office, Warehouse A, Regional Center"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  required
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>Condition</Label>
                <RadioGroup
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value as MaintenanceCondition })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="condition-new" />
                    <Label htmlFor="condition-new" className="cursor-pointer">New</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="used" id="condition-used" />
                    <Label htmlFor="condition-used" className="cursor-pointer">Used</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Running Status */}
              <div className="space-y-2">
                <Label>Running Status</Label>
                <RadioGroup
                  value={formData.running_status}
                  onValueChange={(value) => setFormData({ ...formData, running_status: value as MaintenanceRunningStatus })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="running" id="status-running" />
                    <Label htmlFor="status-running" className="cursor-pointer">Running</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_running" id="status-not-running" />
                    <Label htmlFor="status-not-running" className="cursor-pointer">Not Running</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* S.No / Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serial_number">S.No / Serial Number</Label>
                <Input
                  id="serial_number"
                  type="text"
                  placeholder="e.g., SN-2024-001"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>

              {/* Workstation Number */}
              <div className="space-y-2">
                <Label htmlFor="workstation_number">Workstation Number</Label>
                <Input
                  id="workstation_number"
                  type="text"
                  placeholder="e.g., WS-101, Desk-A5"
                  value={formData.workstation_number}
                  onChange={(e) => setFormData({ ...formData, workstation_number: e.target.value })}
                />
              </div>

              {/* Vendor Contact */}
              <div className="space-y-2">
                <Label htmlFor="contact_name">Vendor Contact</Label>
                <Input
                  id="contact_name"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={formData.contact_name || ''}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>

              {/* Vendor Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="contact_number">Vendor Contact Number</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  value={formData.contact_number || ''}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Add any additional notes or remarks about this maintenance record..."
                  rows={3}
                  className="resize-none"
                  disabled={!!(initialData && initialData.status !== 'pending')}
                />
                <p className="text-xs text-muted-foreground">
                  {initialData && initialData.status !== 'pending' 
                    ? 'Remarks are view-only for approved/rejected requests.'
                    : 'You can add or edit remarks for pending requests.'}
                </p>
              </div>

            </form>
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2 mx-auto w-full max-w-[300px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                initialData ? 'Update Record' : 'Add Maintenance Record'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
