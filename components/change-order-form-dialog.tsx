"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChangeOrderForm } from "@/components/change-order-form"
import { Plus, Edit } from "lucide-react"

interface ChangeOrderFormDialogProps {
  changeOrder?: any
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function ChangeOrderFormDialog({
  changeOrder,
  onSuccess,
  trigger,
}: ChangeOrderFormDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          {changeOrder ? (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Change Order
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Change Order
            </>
          )}
        </Button>
      )}
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {changeOrder ? "Edit Change Order" : "Create New Change Order"}
          </DialogTitle>
          <DialogDescription>
            {changeOrder
              ? "Update change order information"
              : "Fill in the details to create a new change order"}
          </DialogDescription>
        </DialogHeader>
        <ChangeOrderForm
          changeOrder={changeOrder}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
