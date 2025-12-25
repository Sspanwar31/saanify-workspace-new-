// API Configuration
export const API_CONFIG = {
  // Detect if we're in development/preview mode
  isDevelopment: process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost',
  
  // Get the correct base URL
  getBaseUrl() {
    if (typeof window !== 'undefined') {
      // If we're in the browser, use the current origin
      return window.location.origin;
    }
    // Fallback to localhost for server-side
    return 'http://localhost:3000';
  },
  
  // API base URL
  get apiBaseUrl() {
    return this.getBaseUrl();
  }
};

// Helper function to make API calls with correct base URL
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.apiBaseUrl}${endpoint}`;
  
  // Add default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  return response;
};

// Export individual API functions for easier use
export const api = {
  // Passbook APIs
  passbook: {
    getAll: (memberId?: string) => 
      apiCall(memberId ? `/api/client/passbook?memberId=${memberId}` : '/api/client/passbook'),
    create: (data: any) => 
      apiCall('/api/client/passbook/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (entryId: string) => 
      apiCall(`/api/client/passbook/delete?id=${entryId}`, {
        method: 'DELETE',
      }),
  },
  
  // Members APIs
  members: {
    getAll: () => apiCall('/api/client/members'),
    getById: (id: string) => apiCall(`/api/client/members/${id}`),
    create: (data: any) => 
      apiCall('/api/client/members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) => 
      apiCall(`/api/client/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => 
      apiCall(`/api/client/members/${id}`, {
        method: 'DELETE',
      }),
  },
  
  // Loans APIs
  loans: {
    getAll: (memberId?: string) => 
      apiCall(memberId ? `/api/client/loans?memberId=${memberId}` : '/api/client/loans'),
    createRequest: (data: any) => 
      apiCall('/api/client/loan-request/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (loanId: string) => 
      apiCall(`/api/client/loans/${loanId}/approve`, {
        method: 'POST',
      }),
    reject: (loanId: string) => 
      apiCall(`/api/client/loans/${loanId}/reject`, {
        method: 'POST',
      }),
  },
  
  // Maturity APIs
  maturity: {
    calculate: (memberId: string) => 
      apiCall(`/api/maturity/calculate?memberId=${memberId}`),
    claim: (recordId: string) => 
      apiCall('/api/maturity/claim', {
        method: 'POST',
        body: JSON.stringify({ recordId }),
      }),
    updateAll: () => 
      apiCall('/api/maturity', {
        method: 'POST',
      }),
  },
};