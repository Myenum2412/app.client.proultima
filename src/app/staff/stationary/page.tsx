'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStationaryItems, type StationaryItem } from '@/hooks/use-stationary';
import { BuyStationaryDialog } from '@/components/staff/buy-stationary-dialog';
import { DeleteStationaryDialog } from '@/components/staff/delete-stationary-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

export default function StaffStationaryPage() {
  const { user } = useAuth();
  const branch = user?.branch || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<StationaryItem | null>(null);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const {
    stationaryItems,
    isLoading,
    buyStationaryItem,
    deleteStationaryItem,
    isBuying,
    isDeleting,
  } = useStationaryItems(branch);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return stationaryItems;
    const query = searchQuery.toLowerCase();
    return stationaryItems.filter(
      (item) =>
        item.item_name.toLowerCase().includes(query) ||
        item.added_by_staff_name.toLowerCase().includes(query)
    );
  }, [stationaryItems, searchQuery]);

  // Define columns
  const columns: ColumnDef<StationaryItem>[] = useMemo(
    () => [
      {
        accessorKey: 'item_name',
        header: 'Item Name',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.item_name}</div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.quantity}</span>
            <Badge variant="outline" className="text-xs">
              {row.original.unit}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'last_added_date',
        header: 'Last Added Date',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.last_added_date
              ? format(new Date(row.original.last_added_date), 'MMM dd, yyyy')
              : 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: 'added_by_staff_name',
        header: 'Added By',
        cell: ({ row }) => (
          <div className="text-sm">{row.original.added_by_staff_name || 'N/A'}</div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setSelectedItem(row.original);
                setIsBuyDialogOpen(true);
              }}
              disabled={row.original.quantity <= 0}
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Buy
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSelectedItem(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleBuy = (itemId: string, quantity: number, staffName: string) => {
    buyStationaryItem({ itemId, quantityToBuy: quantity, staffName });
  };

  const handleDelete = (itemId: string) => {
    deleteStationaryItem(itemId);
  };

  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Branch information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stationary</h1>
        <p className="text-muted-foreground">
          View and purchase approved stationary items for your branch
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Stationary Items</CardTitle>
          <CardDescription>
            Browse and purchase stationary items. Items with quantity 1 or less will trigger low stock alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stationary items found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? 'No items match your search criteria.'
                  : 'No approved stationary items available for your branch.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : typeof header.column.columnDef.header === 'string'
                              ? header.column.columnDef.header
                              : null}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {typeof cell.column.columnDef.cell === 'function'
                              ? cell.column.columnDef.cell(cell.getContext())
                              : null}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredItems.length
                  )}{' '}
                  of {filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <BuyStationaryDialog
        isOpen={isBuyDialogOpen}
        onOpenChange={setIsBuyDialogOpen}
        item={selectedItem}
        onBuy={handleBuy}
        isBuying={isBuying}
        staffName={user?.name || ''}
      />

      <DeleteStationaryDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        item={selectedItem}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}


