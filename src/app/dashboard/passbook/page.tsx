'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Search, RefreshCw, Download, Plus, HandCoins, 
  Trash2, Edit, Calculator, X, Wallet, User 
} from 'lucide-react';

const PassbookPage = () => {
  // --- States ---
  const [entries, setEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);

  // Modals
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'CASH',
    deposit: '',
    installment: '',
    interest: '',
    fine: '',
    note: ''
  });

  const [loanRequestData, setLoanRequestData] = useState({
    memberId: '',
    amount: ''
  });

  // Derived State for Live Preview (Detailed)
  const [memberLoanStats, setMemberLoanStats] = useState({
    outstanding: 0,
    newBalance: 0
  });

  // --- Initial Data Fetch ---
  useEffect(() => {
    const initData = async () => {
      // Admin ke liye Client ID fetch karna (clients table se)
      const { data: clients } = await supabase.from('clients').select('id').limit(1);
      if (clients && clients.length > 0) {
        setClientId(clients[0].id);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchEntries();
      fetchMembers();
    }
  }, [clientId]);

  const fetchEntries = async () => {
    setLoading(true);
    // Fetch Data
    const { data, error } = await supabase
      .from('passbook_entries')
      .select('*, members(name)') 
      .order('date', { ascending: false });
    
    if (!error) setEntries(data || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('client_id', clientId);
    
    if (data) setMembers(data);
  };

  // --- Logic: Auto Calculation & Live Preview ---
  useEffect(() => {
    if (!formData.memberId) return;

    // 1. Get Member's Current Loan
    const selectedMember = members.find(m => m.id === formData.memberId);
    const currentLoan = selectedMember ? (selectedMember.outstanding_loan || 0) : 0;
    
    // 2. Calculate Fine
    let fineVal = 0;
    if (formData.date) {
      const day = new Date(formData.date).getDate();
      if (day > 15) {
        fineVal = (day - 15) * 10;
      }
    }

    // 3. Calculate Interest (1%)
    const interestVal = Math.round(currentLoan * 0.01);

    // 4. Update Form
    setFormData(prev => ({
      ...prev,
      interest: prev.interest === '' ? String(interestVal) : prev.interest,
      fine: prev.fine === '' ? String(fineVal) : prev.fine
    }));

    // 5. Live Preview Stats (Calculation Logic)
    const instAmt = parseFloat(formData.installment) || 0;
    setMemberLoanStats({
      outstanding: currentLoan,
      newBalance: currentLoan - instAmt
    });

  }, [formData.memberId, formData.date, formData.installment, members]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memberId = e.target.value;
    const member = members.find(m => m.id === memberId);
    setFormData(prev => ({
      ...prev,
      memberId: memberId,
      memberName: member ? member.name : '', // Name Save karne ke liye capture kiya
      interest: '', fine: ''
    }));
  };

  const getTotalAmount = () => {
    return (parseFloat(formData.deposit)||0) + (parseFloat(formData.installment)||0) + (parseFloat(formData.interest)||0) + (parseFloat(formData.fine)||0);
  };

  // --- SUBMIT ENTRY ---
  const handleSubmitEntry = async () => {
    if (!formData.memberId) return alert("Select Member");

    const total = getTotalAmount();
    const instAmt = parseFloat(formData.installment) || 0;

    // 1. Save to passbook_entries
    const { error } = await supabase.from('passbook_entries').insert([{
      member_id: formData.memberId,
      member_name: formData.memberName, // Name Store ho raha hai
      date: formData.date,
      payment_mode: formData.mode,
      deposit_amount: parseFloat(formData.deposit) || 0,
      installment_amount: instAmt,
      interest_amount: parseFloat(formData.interest) || 0,
      fine_amount: parseFloat(formData.fine) || 0,
      total_amount: total,
      note: formData.note
    }]);

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    // 2. Update Member's Loan Balance
    if (instAmt > 0) {
        const member = members.find(m => m.id === formData.memberId);
        const newLoanBal = (member.outstanding_loan || 0) - instAmt;

        await supabase
          .from('members')
          .update({ outstanding_loan: newLoanBal })
          .eq('id', formData.memberId);
        
        fetchMembers(); 
    }

    setShowAddEntry(false);
    fetchEntries();
    setFormData({
      memberId: '', memberName: '', date: new Date().toISOString().split('T')[0],
      mode: 'CASH', deposit: '', installment: '', interest: '', fine: '', note: ''
    });
  };

  // --- LOAN REQUEST ---
  const handleSubmitLoanRequest = async () => {
     if (!clientId || !loanRequestData.memberId) return alert("Select Member first");

     const { error } = await supabase.from('loans').insert([{
        client_id: clientId,
        member_id: loanRequestData.memberId,
        amount: parseFloat(loanRequestData.amount) || 0,
        status: 'pending', 
        start_date: new Date().toISOString().split('T')[0]
     }]);

     if (error) {
        alert("Error requesting loan: " + error.message);
     } else {
        alert("Loan Request Sent Successfully!");
        setShowLoanRequest(false);
        setLoanRequestData({ memberId: '', amount: '' });
     }
  };

  return (
    <div className="p-6 bg-orange-50 min-h-screen font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-orange-900">Sunrise Cooperative Society</h1>
          <p className="text-sm text-orange-600">Digital Passbook Portal</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm">
          <div className="bg-gray-200 p-2 rounded-full"><User size={20} /></div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">Admin User</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entries', val: entries.length, icon: <Wallet size={20}/> },
          { label: 'Total Deposits', val: `₹${entries.reduce((a,b)=>a+(b.deposit_amount||0),0).toLocaleString()}`, icon: <Download size={20}/> },
          { label: 'Installments', val: `₹${entries.reduce((a,b)=>a+(b.installment_amount||0),0).toLocaleString()}`, icon: <RefreshCw size={20}/> },
          { label: 'Interest', val: `₹${entries.reduce((a,b)=>a+(b.interest_amount||0),0).toLocaleString()}`, icon: <HandCoins size={20}/> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.val}</h3>
            </div>
            <div className="text-orange-500 bg-orange-50 p-3 rounded-full">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by member name..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={fetchEntries} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><RefreshCw size={16}/> Refresh</button>
          <button onClick={() => setShowAddEntry(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"><Plus size={16}/> Add Entry</button>
          <button onClick={() => setShowLoanRequest(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"><HandCoins size={16}/> Request Loan</button>
        </div>
      </div>

      {/* Passbook Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold text-lg text-gray-800">Passbook Entries</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Date</th>
                <th className="p-4">Mode</th>
                <th className="p-4 text-green-600">Deposit</th>
                <th className="p-4 text-blue-600">Installment</th>
                <th className="p-4 text-red-500">Interest/Fine</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {entries.filter(e => (e.members?.name || e.member_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{entry.members?.name || entry.member_name || 'Unknown'}</td>
                  <td className="p-4 text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs border border-gray-300">{entry.payment_mode}</span></td>
                  <td className="p-4 font-semibold text-green-600">₹{entry.deposit_amount || 0}</td>
                  <td className="p-4 font-semibold text-blue-600">₹{entry.installment_amount || 0}</td>
                  <td className="p-4 text-red-500">
                    <div className="flex flex-col">
                      <span>Int: ₹{entry.interest_amount}</span>
                      {entry.fine_amount > 0 && <span className="text-xs">Fine: ₹{entry.fine_amount}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold">₹{entry.total_amount}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button className="p-1 hover:text-red-500"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: ADD ENTRY (DETAILED LIVE PREVIEW) --- */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* Left: Form */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Calculator size={24}/> Add New Entry</h2>
                <button onClick={() => setShowAddEntry(false)} className="md:hidden"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="block text-sm font-medium mb-1">Member *</label>
                   <select name="memberId" className="w-full p-2 border rounded-lg bg-gray-50" onChange={handleMemberSelect} value={formData.memberId}>
                      <option value="">Select Member</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Date</label>
                   <input type="date" name="date" className="w-full p-2 border rounded-lg" value={formData.date} onChange={handleInputChange}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Deposit</label>
                    <input type="number" name="deposit" className="w-full p-2 border rounded-lg" value={formData.deposit} onChange={handleInputChange}/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-blue-600">Installment</label>
                    <input type="number" name="installment" className="w-full p-2 border rounded-lg border-blue-100 bg-blue-50" value={formData.installment} onChange={handleInputChange}/>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                    <label className="block text-sm font-medium mb-1">Interest</label>
                    <input type="number" name="interest" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.interest} onChange={handleInputChange}/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Fine</label>
                    <input type="number" name="fine" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.fine} onChange={handleInputChange}/>
                 </div>
              </div>
              <textarea name="note" placeholder="Notes..." className="w-full p-2 border rounded-lg mb-6 h-20" value={formData.note} onChange={handleInputChange}></textarea>
              <button onClick={handleSubmitEntry} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold">Save Entry</button>
            </div>

            {/* Right: Detailed Live Preview */}
            <div className="hidden md:flex w-1/3 bg-gray-50 p-6 flex-col border-l">
               <h3 className="font-bold text-gray-500 mb-4">Live Preview</h3>
               
               {/* Detailed Loan Card */}
               <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Member Info</p>
                <h2 className="text-xl font-bold text-gray-800">{formData.memberName || 'Select Member'}</h2>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current Loan:</span>
                    <span className="font-medium">₹{memberLoanStats.outstanding.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Less Installment:</span>
                    <span>- ₹{(parseFloat(formData.installment)||0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-blue-700">
                    <span>New Balance:</span>
                    <span>₹{memberLoanStats.newBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

               {/* Total Amount Card */}
               <div className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg mt-auto">
                  <h1 className="text-4xl font-bold">₹ {getTotalAmount().toLocaleString()}</h1>
                  <p className="text-xs opacity-75">Total Payable</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: LOAN REQUEST --- */}
      {showLoanRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Request New Loan</h2>
            <select className="w-full p-2 border rounded-lg mb-4" 
              value={loanRequestData.memberId}
              onChange={(e) => setLoanRequestData({...loanRequestData, memberId: e.target.value})}
            >
              <option value="">Choose Member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input 
              type="number" 
              placeholder="Loan Amount" 
              className="w-full p-2 border rounded-lg mb-4"
              value={loanRequestData.amount}
              onChange={(e) => setLoanRequestData({...loanRequestData, amount: e.target.value})}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowLoanRequest(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmitLoanRequest} className="flex-1 py-2 bg-orange-500 text-white rounded-lg">Send Request</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PassbookPage;