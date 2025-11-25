"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskProofs } from "@/hooks/use-task-proofs";
import { TaskDelegation } from "@/types";
import { toast } from "sonner";

interface VerifyDelegationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  delegation: TaskDelegation;
  taskTitle: string;
  taskNo?: string;
}

export function VerifyDelegationDialog({
  isOpen,
  onOpenChange,
  taskId,
  delegation,
  taskTitle,
  taskNo
}: VerifyDelegationDialogProps) {
  const { verifyDelegation, isVerifying } = useTasks();
  const { proofs: taskProofs = [] } = useTaskProofs(taskId);
  
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  
  // Filter proofs uploaded by the delegatee
  const delegateeProofs = taskProofs.filter(proof => 
    proof.staff_id === delegation.to_staff_id && 
    proof.status === 'completed'
  );

  const handleVerify = async (action: 'approve' | 'reject') => {
    try {
      await verifyDelegation({
        taskId,
        delegationId: delegation.id,
        action,
        notes: action === 'reject' ? rejectionNotes : undefined
      });
      
      // Close all dialogs
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      onOpenChange(false);
      
      // Reset state
      setRejectionNotes("");
      
      // Show success message
      toast.success(
        action === 'approve' 
          ? 'Task approved and marked as completed!' 
          : 'Task rejected and returned to delegatee'
      );
    } catch (error) {
      toast.error('Verification failed: ' + (error as Error).message);
      console.error('Verification failed:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Verify Delegated Task Completion
          </DialogTitle>
          <DialogDescription>
            Review the completed work and decide whether to approve or reject the task completion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">{taskNo || 'N/A'}</Badge>
              <h3 className="font-semibold">{taskTitle}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Originally assigned to you, delegated to {delegation.to_staff?.name}
            </p>
          </div>

          {/* Delegation Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {delegation.from_staff?.profile_image_url ? (
                    <AvatarImage src={delegation.from_staff.profile_image_url} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(delegation.from_staff?.name || 'U')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">You (Delegator)</p>
                  <p className="text-xs text-muted-foreground">{delegation.from_staff?.name}</p>
                </div>
              </div>

              <div className="flex-1 h-px bg-border" />

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {delegation.to_staff?.profile_image_url ? (
                    <AvatarImage src={delegation.to_staff.profile_image_url} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(delegation.to_staff?.name || 'U')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Delegatee</p>
                  <p className="text-xs text-muted-foreground">{delegation.to_staff?.name}</p>
                </div>
              </div>
            </div>

            {/* Completion Details */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Completed by {delegation.to_staff?.name}
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Completed on {delegation.completed_by_delegatee_at ? formatDate(delegation.completed_by_delegatee_at) : 'Unknown'}
              </p>
            </div>

            {/* Task Completion Proofs */}
            {delegateeProofs.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Task Completion Proofs:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {delegateeProofs.map((proof) => (
                    <div 
                      key={proof.id} 
                      className="relative group cursor-pointer" 
                      onClick={() => setSelectedProofImage(proof.proof_image_url)}
                    >
                      <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-muted hover:border-primary transition-colors">
                        <Image
                          src={proof.proof_image_url}
                          alt="Task proof"
                          fill
                          className="object-cover"
                        />
                      </div>
                      {proof.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {proof.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delegatee Notes */}
            {delegation.delegatee_notes && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Completion Notes from {delegation.to_staff?.name}:</Label>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm">{delegation.delegatee_notes}</p>
                </div>
              </div>
            )}

            {/* Original Delegation Notes */}
            {delegation.notes && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Original Delegation Notes:</Label>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm">{delegation.notes}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Dialog Footer with Action Buttons */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectDialog(true)}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject & Return
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Complete
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Task Completion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the task as completed and notify the admin. The task will be removed from your pending list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleVerify('approve')}
              disabled={isVerifying}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVerifying ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Task Completion?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this task completion. The task will be returned to {delegation.to_staff?.name} for rework.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionNotes("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleVerify('reject')}
              disabled={isVerifying || !rejectionNotes.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isVerifying ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>

    {/* Image Preview Dialog */}
    {selectedProofImage && (
      <Dialog open={!!selectedProofImage} onOpenChange={() => setSelectedProofImage(null)}>
        <DialogContent className="max-w-4xl">
          <div className="relative w-full h-[600px]">
            <Image
              src={selectedProofImage}
              alt="Proof preview"
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}
