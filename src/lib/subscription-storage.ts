// Simple in-memory storage for subscription plans
// This will persist plans as long as the server is running

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  maxMembers: number;
  maxTransactions: number;
  createdAt?: string;
  updatedAt?: string;
}

class SubscriptionPlanStorage {
  private plans: SubscriptionPlan[] = [];
  private initialized = false;

  constructor() {
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans() {
    if (this.initialized) return;

    this.plans = [
      {
        id: '1',
        name: 'Basic Plan',
        description: 'Perfect for small societies',
        price: 0,
        duration: 1,
        durationType: 'monthly',
        features: ['Up to 50 members', 'Basic transactions', 'Email support'],
        isActive: true,
        maxMembers: 50,
        maxTransactions: 100,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Standard Plan',
        description: 'Great for medium societies',
        price: 1999,
        duration: 1,
        durationType: 'monthly',
        features: ['Up to 200 members', 'Advanced transactions', 'Priority support', 'Mobile app access'],
        isActive: true,
        maxMembers: 200,
        maxTransactions: 500,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Premium Plan',
        description: 'Best for large societies',
        price: 999,
        duration: 1,
        durationType: 'monthly',
        features: ['Up to 500 members', 'Advanced transactions', 'Priority support', 'Mobile app access', 'Advanced analytics'],
        isActive: true,
        maxMembers: 500,
        maxTransactions: 2000,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Enterprise Annual',
        description: 'Complete solution for enterprises',
        price: 49999,
        duration: 1,
        durationType: 'yearly',
        features: ['Everything in Premium', 'Dedicated account manager', 'Custom integrations', 'On-premise option'],
        isActive: true,
        maxMembers: 9999,
        maxTransactions: 99999,
        createdAt: new Date().toISOString()
      }
    ];

    this.initialized = true;
  }

  getAllPlans(): SubscriptionPlan[] {
    return this.plans.filter(plan => plan.isActive);
  }

  getAllPlansIncludingInactive(): SubscriptionPlan[] {
    return this.plans; // Return all plans including inactive ones
  }

  getPlanById(id: string): SubscriptionPlan | undefined {
    return this.plans.find(plan => plan.id === id);
  }

  createPlan(planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      id: Date.now().toString(),
      ...planData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.plans.push(newPlan);
    return newPlan;
  }

  updatePlan(id: string, planData: Partial<SubscriptionPlan>): SubscriptionPlan | null {
    const planIndex = this.plans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return null;

    this.plans[planIndex] = {
      ...this.plans[planIndex],
      ...planData,
      updatedAt: new Date().toISOString()
    };

    return this.plans[planIndex];
  }

  deletePlan(id: string): boolean {
    const planIndex = this.plans.findIndex(plan => plan.id === id);
    if (planIndex === -1) return false;

    this.plans.splice(planIndex, 1);
    return true;
  }

  getValidPlanNames(): string[] {
    return this.plans
      .filter(plan => plan.isActive)
      .map(plan => plan.name.toLowerCase().replace(/\s+/g, ''));
  }
}

// Export singleton instance
export const subscriptionPlanStorage = new SubscriptionPlanStorage();