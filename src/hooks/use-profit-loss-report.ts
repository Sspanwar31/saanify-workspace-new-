import { useSuperClientStore } from '@/lib/super-client/store'

interface PLReportOptions {
  startDate?: string
  endDate?: string
  includeMaturityData?: boolean
}

export const useProfitLossReport = () => {
  const { getMaturityData } = useSuperClientStore()

  const generateReport = async (options: PLReportOptions = {}) => {
    const {
      startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
      includeMaturityData = true
    } = options

    try {
      const maturityData = includeMaturityData ? getMaturityData() : []

      const response = await fetch('/api/reports/profit-loss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          maturityData
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report')
      }

      return result.data
    } catch (error) {
      console.error('Error generating P&L report:', error)
      throw error
    }
  }

  const getMonthlyMaturityExpense = () => {
    const maturityData = getMaturityData()
    const totalInterest = maturityData.reduce((sum, data) => sum + data.finalInterest, 0)
    return Math.round(totalInterest / 36) // Monthly accrued interest
  }

  return {
    generateReport,
    getMonthlyMaturityExpense
  }
}