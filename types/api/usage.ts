export type UsageSummaryResponse = {
  success: true
  data: {
    usage: {
      currentMonth: { used: number; debits: number; credits: number }
      remaining: number
      monthlyLimit: number
      percentage: number
    }
    plan: {
      id: string
      label: string
      pricePerMonth: number
      monthlyGenerations: number
      maxConcurrentJobs: number
      features: string[]
    }
    billingPeriod: { start: string; end: string; daysRemaining: number }
    billing: { customerId?: string; hasAccess: boolean; subscriptionStatus?: string }
    history?: Array<{
      id: string
      type: string
      amount: number
      description: string
      createdAt: string
      jobId?: string
    }>
    computed: {
      isNearLimit: boolean
      canGenerate: boolean
      daysUntilReset: number
      averagePerDay: number
    }
  }
}

