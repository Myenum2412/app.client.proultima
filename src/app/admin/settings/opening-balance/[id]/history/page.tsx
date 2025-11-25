"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BranchOpeningBalance, BranchOpeningBalanceHistoryEntry } from "@/types/cashbook";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus } from "lucide-react";

export default function OpeningBalanceHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const supabase = createClient();

  const [record, setRecord] = useState<BranchOpeningBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryNote, setEntryNote] = useState<string>("");
  const [adding, setAdding] = useState(false);

  // Filters
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");
  const [amountQuery, setAmountQuery] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("branch_opening_balances")
        .select("*")
        .eq("id", id)
        .single();
      if (!error) setRecord(data as BranchOpeningBalance);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const history: BranchOpeningBalanceHistoryEntry[] = useMemo(() => {
    const items = (record?.balance_history as BranchOpeningBalanceHistoryEntry[] | undefined) || [];
    return [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [record?.balance_history]);

  const filteredHistory = useMemo(() => {
    let list = history;
    if (filterStart) list = list.filter(h => h.date >= filterStart);
    if (filterEnd) list = list.filter(h => h.date <= filterEnd);
    if (amountQuery.trim()) {
      const q = amountQuery.replace(/[, ]/g, '').toLowerCase();
      list = list.filter(h => String(h.amount).toLowerCase().includes(q));
    }
    return list;
  }, [history, filterStart, filterEnd, amountQuery]);

  const handleAddEntry = async () => {
    if (!record) return;
    setAdding(true);
    const newHistory = [...(record.balance_history || []), { date: entryDate, amount: entryAmount, note: entryNote || undefined }];
    const newOpening = (record.opening_balance || 0) + entryAmount;
    const { data, error } = await supabase
      .from("branch_opening_balances")
      .update({ balance_history: newHistory, opening_balance: newOpening, updated_at: new Date().toISOString() })
      .eq("id", record.id)
      .select()
      .single();
    setAdding(false);
    if (!error) {
      setRecord(data as BranchOpeningBalance);
      setAddDialogOpen(false);
      setEntryAmount(0);
      setEntryNote("");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Record not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Opening Balance History - {record.branch}</h1>
          <p className="text-sm text-muted-foreground">Current opening balance: ₹{record.opening_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-start">Start Date</Label>
            <Input id="filter-start" type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-end">End Date</Label>
            <Input id="filter-end" type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount-q">Search by amount</Label>
            <Input
              id="amount-q"
              type="text"
              placeholder="e.g. 500, -200, 1000"
              value={amountQuery}
              onChange={(e) => setAmountQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add entry
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>All opening balance entries for this branch</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-muted-foreground">No results.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">S.No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((h, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell>{h.date}</TableCell>
                    <TableCell className={`text-right ${h.amount < 0 ? 'text-red-600' : 'text-green-700'}`}> {h.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{h.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Opening Balance Entry - {record.branch}</DialogTitle>
            <DialogDescription>Append a new entry. Positive increases the balance; negative decreases it.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entry-date">Date</Label>
              <Input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-amount">Amount (₹)</Label>
              <Input id="entry-amount" type="number" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-note">Note (optional)</Label>
              <Input id="entry-note" type="text" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="Reason or reference" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={adding || !Number.isFinite(entryAmount)}>
              {adding ? (
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
    </div>
  );
}
