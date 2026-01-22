// src/hooks/useCurrency.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';

const CURRENCY_SYMBOLS: Record<string, string> = {
  'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 
  'AUD': 'A$', 'CAD': 'C$', 'CNY': '¥', 'AED': 'د.إ', 
  'SAR': '﷼', 'SGD': 'S$', 'MYR': 'RM', 'THB': '฿', 
  'IDR': 'Rp', 'PKR': '₨', 'BDT': '৳', 'NPR': '₨', 'LKR': 'Rs'
};

export function useCurrency() {
  const [currencyCode, setCurrencyCode] = useState('INR'); // Default
  const [symbol, setSymbol] = useState('₹');

  useEffect(() => {
    const fetchSettings = async () => {
      const user = JSON.parse(localStorage.getItem('current_user') || 'null');
      if (!user?.id) return;

      const clientId = user.client_id || user.id;

      const { data } = await supabase
        .from('clients')
        .select('currency')
        .eq('id', clientId)
        .single();

      if (data?.currency) {
        setCurrencyCode(data.currency);
        setSymbol(CURRENCY_SYMBOLS[data.currency] || data.currency);
      }
    };

    fetchSettings();
  }, []);

  // Universal Formatter Function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { // en-IN formatting pattern (commas) sabke liye clean lagta hai
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return { currencyCode, symbol, formatCurrency };
}
