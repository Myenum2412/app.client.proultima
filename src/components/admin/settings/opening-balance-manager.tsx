'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Loader2, AlertCircle, Building, Trash2, Plus, History } from 'lucide-react';
import { useOpeningBalance } from '@/hooks/use-opening-balance';
import { useSystemOptions } from '@/hooks/use-system-options';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { Calendar as CalendarIconLucide } from 'lucide-react';

export function OpeningBalanceManager() {
  const { openingBalances, isLoading, updateOpeningBalance, isUpdating, deleteOpeningBalance, isDeleting, appendOpeningBalanceEntry, isAppending } = useOpeningBalance();
  const { branches: systemBranches } = useSystemOptions();
  
  // Distinct branches from existing opening balances
  const existingBranches = useMemo(() => Array.from(new Set(openingBalances.map(ob => ob.branch).filter(Boolean))) as string[], [openingBalances]);
  
  // Available branches from System Options that do not already have an opening balance
  const availableBranches = useMemo(() => {
    const sys = (systemBranches || []).map(b => String(b));
    const setExisting = new Set(existingBranches.map(b => String(b).toLowerCase()));
    return sys.filter(b => !setExisting.has(String(b).toLowerCase()));
  }, [systemBranches, existingBranches]);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [newBalance, setNewBalance] = useState<number>(0);

  // Create dialog state
  const [createBranch, setCreateBranch] = useState<string>('');
  const [createAmount, setCreateAmount] = useState<number>(0);

  // Add Entry form state
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryNote, setEntryNote] = useState<string>('');

  const openEditDialog = (branch: string) => {
    const currentBalance = openingBalances.find(ob => ob.branch === branch);
    setSelectedBranch(branch);
    setNewBalance(currentBalance?.opening_balance || 0);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (branch: string) => {
    setSelectedBranch(branch);
    setDeleteDialogOpen(true);
  };

  const openAddEntryDialog = (branch: string) => {
    setSelectedBranch(branch);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryAmount(0);
    setEntryNote('');
    setAddEntryDialogOpen(true);
  };

  const openCreateDialog = () => {
    setCreateBranch(availableBranches[0] || '');
    setCreateAmount(0);
    setCreateDialogOpen(true);
  };

  const handleCreate = () => {
    if (!createBranch || createAmount < 0) return;
    updateOpeningBalance(
      { branch: createBranch, opening_balance: createAmount },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setCreateBranch('');
          setCreateAmount(0);
        },
      }
    );
  };

  const handleSave = () => {
    if (newBalance < 0) {
      return;
    }

    updateOpeningBalance(
      { branch: selectedBranch, opening_balance: newBalance },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedBranch('');
          setNewBalance(0);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteOpeningBalance(selectedBranch, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedBranch('');
      },
    });
  };

  const handleAddEntry = () => {
    if (!selectedBranch) return;
    if (!Number.isFinite(entryAmount)) return;

    appendOpeningBalanceEntry({
      branch: selectedBranch,
      amount: entryAmount,
      date: entryDate,
      note: entryNote || undefined,
    }, {
      onSuccess: () => {
        setAddEntryDialogOpen(false);
        setSelectedBranch('');
        setEntryAmount(0);
        setEntryNote('');
      }
    });
  };

  const getCurrentBalance = (branch: string): number => {
    const balance = openingBalances.find(ob => ob.branch === branch);
    return balance?.opening_balance || 0;
  };

  const getLastUpdated = (branch: string): string => {
    const balance = openingBalances.find(ob => ob.branch === branch);
    if (!balance?.updated_at) return 'Never';
    return format(new Date(balance.updated_at), 'MMM dd, yyyy h:mm a');
  };

  const getIdByBranch = (branch: string): string | undefined => {
    return openingBalances.find(ob => ob.branch === branch)?.id;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Branch Opening Balances
            </CardTitle>
            <CardDescription>
              Set the opening cash balance for each branch. You can add incremental entries; the system maintains history.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openCreateDialog} disabled={availableBranches.length === 0}>
              <Plus className="h-3 w-3 mr-1" /> Create Opening Balance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {existingBranches.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-3">
              <p>No branches found. Add staff members or system branches to see branches.</p>
              <div>
                <Button variant="outline" onClick={openCreateDialog} disabled={availableBranches.length === 0}>
                  <Plus className="h-3 w-3 mr-1" /> Create Opening Balance
                </Button>
                {availableBranches.length === 0 && (
                  <p className="mt-2 text-xs">No available branches in System Options.</p>
                )}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingBranches.map((branch) => (
                  <TableRow key={branch}>
                    <TableCell className="font-medium">{branch}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-lg font-bold text-blue-600">
                        ₹{getCurrentBalance(branch).toLocaleString('en-IN', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getLastUpdated(branch)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddEntryDialog(branch)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add entry
                        </Button>
                        {getIdByBranch(branch) && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/settings/opening-balance/${getIdByBranch(branch)}/history`}>
                              <History className="h-3 w-3 mr-1" />
                              View history
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(branch)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Overwrite
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(branch)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Opening Balance Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Opening Balance</DialogTitle>
            <DialogDescription>
              Select a branch and set its starting opening balance. You can add incremental entries later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-branch">Branch</Label>
              <Select value={createBranch} onValueChange={setCreateBranch}>
                <SelectTrigger id="create-branch">
                  <SelectValue placeholder={availableBranches.length ? 'Select branch' : 'No branches available'} />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-amount">Opening Balance (₹)</Label>
              <Input id="create-amount" type="number" step="0.01" min="0" value={createAmount} onChange={(e) => setCreateAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This creates the first opening balance for the branch. Use "Add entry" to adjust later.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isUpdating || !createBranch || createAmount < 0}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={addEntryDialogOpen} onOpenChange={setAddEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Opening Balance Entry - {selectedBranch}</DialogTitle>
            <DialogDescription>
              Append a new entry to the opening balance history. This will increase/decrease the branch opening balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entry-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIconLucide className="mr-2 h-4 w-4 opacity-60" />
                    {entryDate ? format(new Date(entryDate), 'MMM dd, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <ShadCalendar
                    mode="single"
                    selected={entryDate ? new Date(entryDate) : undefined}
                    onSelect={(d) => d && setEntryDate(format(d, 'yyyy-MM-dd'))}
                    defaultMonth={entryDate ? new Date(entryDate) : new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-amount">Amount (₹)</Label>
              <Input id="entry-amount" type="number" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-note">Note (optional)</Label>
              <Input id="entry-note" type="text" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="Reason or reference" />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Positive values increase opening balance, negative values decrease it.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEntryDialogOpen(false)} disabled={isAppending}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={isAppending || !Number.isFinite(entryAmount)}>
              {isAppending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Entry'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overwrite Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Opening Balance - {selectedBranch}</DialogTitle>
            <DialogDescription>
              This will update the starting balance for all cashbook calculations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Current Opening Balance
              </Label>
              <p className="text-2xl font-bold text-blue-600">
                ₹{getCurrentBalance(selectedBranch).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-balance">New Opening Balance (₹)</Label>
              <Input
                id="new-balance"
                type="number"
                step="0.01"
                min="0"
                value={newBalance}
                onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                placeholder="Enter new opening balance"
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changing the opening balance will affect all cashbook calculations for this branch.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isUpdating || newBalance < 0}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Balance'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Opening Balance - {selectedBranch}</DialogTitle>
            <DialogDescription>
              This will permanently remove the opening balance for this branch. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Deleting this opening balance will affect all cashbook calculations for this branch. 
                Make sure this branch is no longer needed before proceeding.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Current Opening Balance
              </Label>
              <p className="text-2xl font-bold text-red-600">
                ₹{getCurrentBalance(selectedBranch).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

