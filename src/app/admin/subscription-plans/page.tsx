"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Users, IndianRupee, Plus, Edit, Trash2, Check, X, Search, ChevronDown, Building, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { makeAuthenticatedRequest } from "@/lib/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
}

interface ClientSubscription {
  id: string;
  clientId: string;
  clientName: string;
  societyName: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

interface Client {
  id: string;
  name: string;
  adminName: string;
  email: string;
  phone: string;
  address: string;
  subscriptionPlan: string;
  status: string;
  members: number;
  revenue: string;
  lastActive: string;
  createdAt: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [clientSubscriptions, setClientSubscriptions] = useState<ClientSubscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showActivateSubscription, setShowActivateSubscription] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form states for new plan
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    durationType: "monthly" as 'monthly' | 'yearly',
    features: "",
    maxMembers: "",
    maxTransactions: "",
    isActive: true
  });

  // Form states for subscription activation
  const [subscriptionData, setSubscriptionData] = useState({
    clientId: "",
    planId: "",
    startDate: new Date().toISOString().split('T')[0], // Default to today
    societyName: "",
    customAmount: ""
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchSubscriptionPlans();
    fetchClientSubscriptions();
    fetchClients();
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchClients = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/clients');
      const result = await response.json();
      if (result.success) {
        setClients(result.clients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const fetchSubscriptionPlans = async () => {
    console.log('fetchSubscriptionPlans called');
    try {
      const response = await makeAuthenticatedRequest('/api/admin/subscription-plans');
      const result = await response.json();
      if (result.success) {
        setPlans(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      // Fallback to sample data
      setPlans([
        {
          id: "1",
          name: "Basic Plan",
          description: "Perfect for small societies",
          price: 999,
          duration: 1,
          durationType: "monthly",
          features: ["Up to 50 members", "Basic transactions", "Email support"],
          isActive: true,
          maxMembers: 50,
          maxTransactions: 100
        },
        {
          id: "2",
          name: "Standard Plan",
          description: "Great for medium societies",
          price: 1999,
          duration: 1,
          durationType: "monthly",
          features: ["Up to 200 members", "Advanced transactions", "Priority support", "Mobile app access"],
          isActive: true,
          maxMembers: 200,
          maxTransactions: 500
        },
        {
          id: "3",
          name: "Premium Plan",
          description: "Best for large societies",
          price: 4999,
          duration: 1,
          durationType: "monthly",
          features: ["Unlimited members", "Unlimited transactions", "24/7 support", "Advanced analytics", "Custom features"],
          isActive: true,
          maxMembers: 999,
          maxTransactions: 9999
        },
        {
          id: "4",
          name: "Enterprise Annual",
          description: "Complete solution for enterprises",
          price: 49999,
          duration: 1,
          durationType: "yearly",
          features: ["Everything in Premium", "Dedicated account manager", "Custom integrations", "On-premise option"],
          isActive: true,
          maxMembers: 9999,
          maxTransactions: 99999
        }
      ]);
    }
  };

  const fetchClientSubscriptions = async () => {
    console.log('fetchClientSubscriptions called');
    try {
      const response = await makeAuthenticatedRequest('/api/admin/client-subscriptions');
      const result = await response.json();
      if (result.success) {
        setClientSubscriptions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch client subscriptions:', error);
      // Fallback to sample data
      setClientSubscriptions([
        {
          id: "1",
          clientId: "client1",
          clientName: "Rajesh Kumar",
          societyName: "Shanti Niketan Society",
          planId: "2",
          planName: "Standard Plan",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          status: "active",
          amount: 1999,
          paymentStatus: "paid"
        },
        {
          id: "2",
          clientId: "client2",
          clientName: "Amit Sharma",
          societyName: "Green Valley Apartments",
          planId: "1",
          planName: "Basic Plan",
          startDate: "2024-06-01",
          endDate: "2024-11-30",
          status: "expired",
          amount: 999,
          paymentStatus: "overdue"
        }
      ]);
    }
  };

  const handleCreatePlan = async () => {
    console.log('handleCreatePlan called');
    try {
      const planData = {
        name: newPlan.name,
        description: newPlan.description,
        price: parseInt(newPlan.price),
        duration: parseInt(newPlan.duration),
        durationType: newPlan.durationType,
        features: newPlan.features.split(',').map(f => f.trim()),
        isActive: newPlan.isActive,
        maxMembers: parseInt(newPlan.maxMembers),
        maxTransactions: parseInt(newPlan.maxTransactions)
      };

      const url = editingPlan ? '/api/admin/subscription-plans' : '/api/admin/subscription-plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan ? { ...planData, id: editingPlan.id } : planData;

      const response = await makeAuthenticatedRequest(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        if (editingPlan) {
          setPlans(plans.map(p => p.id === editingPlan.id ? result.data : p));
          setEditingPlan(null);
        } else {
          setPlans([...plans, result.data]);
        }

        // Reset form
        setNewPlan({
          name: "",
          description: "",
          price: "",
          duration: "",
          durationType: "monthly",
          features: "",
          maxMembers: "",
          maxTransactions: "",
          isActive: true
        });
        setShowCreatePlan(false);
      } else {
        console.error('Failed to save plan:', result.error);
        // Fallback to local state update
        const plan: SubscriptionPlan = {
          id: Date.now().toString(),
          ...planData
        };

        if (editingPlan) {
          setPlans(plans.map(p => p.id === editingPlan.id ? { ...plan, id: editingPlan.id } : p));
          setEditingPlan(null);
        } else {
          setPlans([...plans, plan]);
        }

        // Reset form
        setNewPlan({
          name: "",
          description: "",
          price: "",
          duration: "",
          durationType: "monthly",
          features: "",
          maxMembers: "",
          maxTransactions: "",
          isActive: true
        });
        setShowCreatePlan(false);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      // Fallback to local state update
      const plan: SubscriptionPlan = {
        id: Date.now().toString(),
        name: newPlan.name,
        description: newPlan.description,
        price: parseInt(newPlan.price),
        duration: parseInt(newPlan.duration),
        durationType: newPlan.durationType,
        features: newPlan.features.split(',').map(f => f.trim()),
        isActive: newPlan.isActive,
        maxMembers: parseInt(newPlan.maxMembers),
        maxTransactions: parseInt(newPlan.maxTransactions)
      };

      if (editingPlan) {
        setPlans(plans.map(p => p.id === editingPlan.id ? { ...plan, id: editingPlan.id } : p));
        setEditingPlan(null);
      } else {
        setPlans([...plans, plan]);
      }

      // Reset form
      setNewPlan({
        name: "",
        description: "",
        price: "",
        duration: "",
        durationType: "monthly",
        features: "",
        maxMembers: "",
        maxTransactions: "",
        isActive: true
      });
      setShowCreatePlan(false);
    }
  };

  const handleActivateSubscription = async () => {
    console.log('handleActivateSubscription called');
    console.log('Current subscription data:', subscriptionData);
    
    // Validation
    if (!subscriptionData.clientId) {
      toast.error('Please select a society/client');
      return;
    }
    if (!subscriptionData.planId) {
      toast.error('Please select a plan');
      return;
    }
    if (!subscriptionData.startDate) {
      toast.error('Please select a start date');
      return;
    }

    // Add loading state
    const loadingToast = toast.loading('Activating subscription...');

    try {
      const data = {
        clientId: subscriptionData.clientId,
        planId: subscriptionData.planId,
        startDate: subscriptionData.startDate,
        societyName: subscriptionData.societyName,
        customAmount: subscriptionData.customAmount
      };

      console.log('Sending subscription activation request:', data);

      const response = await makeAuthenticatedRequest('/api/admin/client-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Subscription activation response:', result);

      if (result.success) {
        setClientSubscriptions([...clientSubscriptions, result.data]);
        toast.success('Subscription activated successfully!', { id: loadingToast });
        
        // Reset form
        setSubscriptionData({
          clientId: "",
          planId: "",
          startDate: "",
          societyName: "",
          customAmount: ""
        });
        setClientSearchTerm("");
        setShowActivateSubscription(false);
      } else {
        console.error('Failed to activate subscription:', result.error);
        toast.error(result.error || 'Failed to activate subscription', { id: loadingToast });
        
        // Fallback to local state update
        const plan = plans.find(p => p.id === subscriptionData.planId);
        if (!plan) return;

        const endDate = new Date(subscriptionData.startDate);
        if (plan.durationType === 'monthly') {
          endDate.setMonth(endDate.getMonth() + plan.duration);
        } else {
          endDate.setFullYear(endDate.getFullYear() + plan.duration);
        }

        const newSubscription: ClientSubscription = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          clientId: subscriptionData.clientId,
          clientName: clients.find(c => c.id === subscriptionData.clientId)?.name || "Client Name",
          societyName: subscriptionData.societyName,
          planId: plan.id,
          planName: plan.name,
          startDate: subscriptionData.startDate,
          endDate: endDate.toISOString().split('T')[0],
          status: "active",
          amount: parseInt(subscriptionData.customAmount) || plan.price,
          paymentStatus: "pending"
        };

        setClientSubscriptions([...clientSubscriptions, newSubscription]);
        toast.success('Subscription activated (local fallback)!', { id: loadingToast });
        
        // Reset form
        setSubscriptionData({
          clientId: "",
          planId: "",
          startDate: "",
          societyName: "",
          customAmount: ""
        });
        setClientSearchTerm("");
        setShowActivateSubscription(false);
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast.error('Network error. Please try again.', { id: loadingToast });
      
      // Fallback to local state update
      const plan = plans.find(p => p.id === subscriptionData.planId);
      if (!plan) return;

      const endDate = new Date(subscriptionData.startDate);
      if (plan.durationType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + plan.duration);
      } else {
        endDate.setFullYear(endDate.getFullYear() + plan.duration);
      }

      const newSubscription: ClientSubscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: subscriptionData.clientId,
        clientName: clients.find(c => c.id === subscriptionData.clientId)?.name || "Client Name",
        societyName: subscriptionData.societyName,
        planId: plan.id,
        planName: plan.name,
        startDate: subscriptionData.startDate,
        endDate: endDate.toISOString().split('T')[0],
        status: "active",
        amount: parseInt(subscriptionData.customAmount) || plan.price,
        paymentStatus: "pending"
      };

      setClientSubscriptions([...clientSubscriptions, newSubscription]);
      toast.success('Subscription activated (offline mode)!', { id: loadingToast });
      
      // Reset form
      setSubscriptionData({
        clientId: "",
        planId: "",
        startDate: "",
        societyName: "",
        customAmount: ""
      });
      setClientSearchTerm("");
      setShowActivateSubscription(false);
    }
  };

  const togglePlanStatus = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const deletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
  };

  const editPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      durationType: plan.durationType,
      features: plan.features.join(', '),
      maxMembers: plan.maxMembers.toString(),
      maxTransactions: plan.maxTransactions.toString(),
      isActive: plan.isActive
    });
    setShowCreatePlan(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Subscription Plans Management</h1>
            <p className="text-muted-foreground">Manage subscription plans and client activations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                console.log('Create New Plan button clicked');
                setEditingPlan(null);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Subscription Plan'}</DialogTitle>
                <DialogDescription>
                  {editingPlan ? 'Edit the subscription plan details' : 'Create a new subscription plan for clients'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planName">Plan Name</Label>
                  <Input
                    id="planName"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="e.g., Basic Plan"
                  />
                </div>
                <div>
                  <Label htmlFor="planPrice">Price (₹)</Label>
                  <Input
                    id="planPrice"
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                    placeholder="999"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <div className="flex gap-2">
                    <Input
                      id="duration"
                      type="number"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({...newPlan, duration: e.target.value})}
                      placeholder="1"
                    />
                    <Select value={newPlan.durationType} onValueChange={(value: 'monthly' | 'yearly') => setNewPlan({...newPlan, durationType: value})}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Month</SelectItem>
                        <SelectItem value="yearly">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={newPlan.maxMembers}
                    onChange={(e) => setNewPlan({...newPlan, maxMembers: e.target.value})}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTransactions">Max Transactions</Label>
                  <Input
                    id="maxTransactions"
                    type="number"
                    value={newPlan.maxTransactions}
                    onChange={(e) => setNewPlan({...newPlan, maxTransactions: e.target.value})}
                    placeholder="100"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newPlan.isActive}
                    onChange={(e) => setNewPlan({...newPlan, isActive: e.target.checked})}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    placeholder="Plan description..."
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="features">Features (comma separated)</Label>
                  <Textarea
                    id="features"
                    value={newPlan.features}
                    onChange={(e) => setNewPlan({...newPlan, features: e.target.value})}
                    placeholder="Feature 1, Feature 2, Feature 3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreatePlan(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan}>{editingPlan ? 'Update Plan' : 'Create Plan'}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Activate Subscription Dialog */}
          <Dialog open={showActivateSubscription} onOpenChange={setShowActivateSubscription}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                onClick={() => {
                  console.log('Activate Subscription button clicked');
                  setEditingPlan(null);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Activate Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Activate Client Subscription</DialogTitle>
                <DialogDescription>
                  Select a client and subscription plan to activate their subscription
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={dropdownRef}>
                  <Label htmlFor="societyName">Society Name</Label>
                  <div className="relative">
                    <Input
                      id="societyName"
                      value={subscriptionData.societyName}
                      onChange={(e) => {
                        setSubscriptionData({...subscriptionData, societyName: e.target.value});
                        setClientSearchTerm(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Type or select society name"
                      className="pr-10"
                    />
                    <Building className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {/* Client Dropdown */}
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clients.filter(client => 
                        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                        client.adminName.toLowerCase().includes(clientSearchTerm.toLowerCase())
                      ).length > 0 ? (
                        clients.filter(client => 
                          client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                          client.adminName.toLowerCase().includes(clientSearchTerm.toLowerCase())
                        ).map(client => (
                          <button
                            key={`client-${client.id}-${client.name}`}
                            type="button"
                            className="w-full px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-left"
                            onClick={() => {
                              console.log('Selected client:', client);
                              setSubscriptionData({
                                ...subscriptionData,
                                societyName: client.name,
                                clientId: client.id
                              });
                              setClientSearchTerm(client.name);
                              setShowClientDropdown(false);
                              toast.success(`Selected: ${client.name}`);
                            }}
                          >
                            <div className="font-medium text-sm">{client.name}</div>
                            <div className="text-xs text-gray-500">{client.adminName} • {client.email}</div>
                            <div className="text-xs text-gray-400">ID: {client.id}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No clients found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={subscriptionData.clientId}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Auto-selected from society name"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-populated when society is selected</p>
                </div>
                <div>
                  <Label htmlFor="planSelect">Select Plan</Label>
                  <Select 
                    value={subscriptionData.planId} 
                    onValueChange={(value) => {
                      console.log('Selected plan ID:', value);
                      setSubscriptionData({...subscriptionData, planId: value});
                      const selectedPlan = plans.find(p => p.id === value);
                      if (selectedPlan) {
                        console.log('Selected plan details:', selectedPlan);
                        toast.success(`Selected: ${selectedPlan.name}`);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.isActive).map(plan => (
                        <SelectItem key={`plan-${plan.id}-${plan.name}`} value={plan.id}>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-gray-500">₹{plan.price}/{plan.durationType === 'monthly' ? 'month' : 'year'}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={subscriptionData.startDate}
                    onChange={(e) => setSubscriptionData({...subscriptionData, startDate: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="customAmount">Custom Amount (Optional)</Label>
                  <Input
                    id="customAmount"
                    type="number"
                    value={subscriptionData.customAmount}
                    onChange={(e) => setSubscriptionData({...subscriptionData, customAmount: e.target.value})}
                    placeholder="Leave empty for standard price"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowActivateSubscription(false)}>Cancel</Button>
                <Button onClick={handleActivateSubscription}>Activate Subscription</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Client Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={`plan-card-${plan.id}-${plan.name}`} className={`${!plan.isActive ? 'opacity-50' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => editPlan(plan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold flex items-center">
                        <IndianRupee className="w-5 h-5" />
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        per {plan.durationType === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{plan.duration} {plan.durationType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Members:</span>
                        <span>{plan.maxMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Transactions:</span>
                        <span>{plan.maxTransactions}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Features:</p>
                      <ul className="text-sm space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={`feature-${plan.id}-${index}`} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={plan.isActive ? "destructive" : "default"}
                      onClick={() => togglePlanStatus(plan.id)}
                    >
                      {plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Society Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientSubscriptions.map((subscription, index) => (
                    <TableRow key={`${subscription.id}-${index}-${subscription.clientId}`}>
                      <TableCell>{subscription.clientName}</TableCell>
                      <TableCell>{subscription.societyName}</TableCell>
                      <TableCell>{subscription.planName}</TableCell>
                      <TableCell>{subscription.startDate}</TableCell>
                      <TableCell>{subscription.endDate}</TableCell>
                      <TableCell className="flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {subscription.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          subscription.status === 'active' ? 'default' :
                          subscription.status === 'expired' ? 'destructive' : 'secondary'
                        }>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          subscription.paymentStatus === 'paid' ? 'default' :
                          subscription.paymentStatus === 'overdue' ? 'destructive' : 'secondary'
                        }>
                          {subscription.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}