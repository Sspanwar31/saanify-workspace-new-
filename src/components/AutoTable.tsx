"use client";

import React, { useState, useMemo } from "react";
import { format } from "date-fns";

interface AutoTableProps {
  data: any[];
  title?: string;
  className?: string;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export default function AutoTable({ 
  data, 
  title, 
  className = "",
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10 
}: AutoTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Auto extract columns from first object, filtering out nested objects for cleaner display
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const firstRow = data[0];
    const cols = Object.keys(firstRow).filter(key => {
      const value = firstRow[key];
      // Filter out complex objects that shouldn't be displayed as table cells
      return typeof value !== 'object' || value === null || Array.isArray(value);
    });
    
    return cols;
  }, [data]);

  // Format cell values based on type and content
  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return "--";
    if (typeof value === "boolean") return value ? "✅ Yes" : "❌ No";
    if (typeof value === "number") {
      // Format currency for fields that suggest monetary values
      if (key.toLowerCase().includes('amount') || 
          key.toLowerCase().includes('balance') || 
          key.toLowerCase().includes('emi') || 
          key.toLowerCase().includes('deposit') ||
          key.toLowerCase().includes('loan')) {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }
      return value.toLocaleString('en-IN');
    }
    if (typeof value === "string") {
      // Format dates
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          return format(new Date(value), 'dd MMM yyyy');
        } catch {
          return value;
        }
      }
      // Format ISO dates
      if (value.includes('T') && value.includes('Z')) {
        try {
          return format(new Date(value), 'dd MMM yyyy HH:mm');
        } catch {
          return value;
        }
      }
      // Capitalize first letter for status-like fields
      if (key.toLowerCase().includes('status') || 
          key.toLowerCase().includes('type') ||
          key.toLowerCase().includes('reference')) {
        return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      // Format underscore-separated field names
      return value.replace(/_/g, ' ');
    }
    return String(value);
  };

  // Get column header display name
  const getColumnHeader = (key: string): string => {
    // Special mappings for better readability
    const mappings: Record<string, string> = {
      'memberId': 'Member ID',
      'loan_id': 'Loan ID',
      'emi_number': 'EMI #',
      'fine_amount': 'Fine Amount',
      'interest_amount': 'Interest Amount',
      'payment_mode': 'Payment Mode',
      'added_by': 'Added By',
      'created_at': 'Created',
      'updated_at': 'Updated',
      'deposit_reference': 'Deposit Ref',
      'member_deposit_amount': 'Member Deposit'
    };
    
    return mappings[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => 
      columns.some(col => {
        const value = row[col];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, columns, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (key: string) => {
    if (!sortable) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset pagination when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (!data || data.length === 0) {
    return (
      <div className={`p-4 border rounded-lg shadow bg-white mt-4 ${className}`}>
        {title && <h2 className="text-xl font-semibold mb-3">{title}</h2>}
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No records found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg shadow bg-white mt-4 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <div className="text-sm text-gray-500">
            {filteredData.length} of {data.length} records
          </div>
        </div>
      )}

      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th 
                  key={col} 
                  className={`border border-gray-200 p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-between">
                    <span>{getColumnHeader(col)}</span>
                    {sortable && sortConfig?.key === col && (
                      <svg className="ml-1 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortConfig.direction === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="border border-gray-200 p-3 text-sm text-gray-900">
                    {formatCellValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}