"use client"

import React, { useState } from 'react'
import { BillingSectionCard } from './billing-section-card'
import { InvoiceTable } from './invoice-table'
import { Invoice, InvoiceFilters } from '@/lib/types/invoice'
import { motion } from "motion/react"

interface BillingAndInvoicesProps {
  initialInvoices?: Invoice[]
}

const BillingAndInvoices = ({ initialInvoices }: BillingAndInvoicesProps) => {
  const [filters, setFilters] = useState<InvoiceFilters>({})

  const handleFiltersChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters)
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex-1 overflow-y-auto p-4 lg:p-6 my-4"
    >
      <div className="space-y-6">
        {/* Billing Section Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <BillingSectionCard initialInvoices={initialInvoices} filters={filters} />
        </motion.div>

        {/* Invoice Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <InvoiceTable initialInvoices={initialInvoices} onFiltersChange={handleFiltersChange} />
        </motion.div>
      </div>
    </motion.main>
  )
}

export default BillingAndInvoices