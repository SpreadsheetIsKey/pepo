'use client'

import { useState } from 'react'
import { CsvUpload } from '@/components/csv-upload'
import { TransactionList } from '@/components/transaction-list'
import { SpendingDashboard } from '@/components/spending-dashboard'
import { IncomeExpenseSummary } from '@/components/income-expense-summary'

export function DashboardContent() {
  const [refreshKey, setRefreshKey] = useState(0)

  // This function will be called when transactions are updated
  function handleTransactionChange() {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      {/* CSV Upload Section */}
      <div className="mb-8">
        <CsvUpload onUploadComplete={handleTransactionChange} />
      </div>

      {/* Income vs Expense Summary */}
      <div className="mb-8">
        <IncomeExpenseSummary key={`income-${refreshKey}`} />
      </div>

      {/* Spending Dashboard Section */}
      <div className="mb-8">
        <SpendingDashboard key={`spending-${refreshKey}`} />
      </div>

      {/* Transaction List Section */}
      <div className="mb-8">
        <TransactionList
          key={`transactions-${refreshKey}`}
          onTransactionUpdate={handleTransactionChange}
        />
      </div>
    </>
  )
}
