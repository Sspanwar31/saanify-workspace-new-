import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Local supabase client
import { 
  Search, RefreshCw, Download, Plus, HandCoins, 
  Trash2, Edit, Calculator, X, Wallet, User 
} from 'lucide-react';

const PassbookPage = () => {
  // --- States ---
  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'Cash',
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

  // Derived State for Live Preview
  const [memberLoanStats, setMemberLoanStats] = useState({
    outstanding: 0,
    newBalance: 0
  });

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchEntries();
    fetchMembers();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('passbook_entries')
      .select('*')
      .order('date', { ascending: false });
    if (!error) setEntries(data || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    // Assuming you have a 'members' table with 'id', 'name', 'outstanding_loan'
    const { data } = await supabase.from('members').select('*');
    if (data) setMembers(data);
  };

  // --- Logic: Auto Calculation ---
  useEffect(() => {
    if (!formData.memberId) return;

    // 1. Get Member's Current Loan
    const selectedMember = members.find(m => m.id === formData.memberId);
    const currentLoan = selectedMember ? selectedMember.outstanding_loan : 0;
    
    // 2. Calculate Fine (After 15th of month, 10rs/day)
    let fineVal = 0;
    if (formData.date) {
      const day = new Date(formData.date).getDate();
      if (day > 15) {
        fineVal = (day - 15) * 10;
      }
    }

    // 3. Calculate Interest (1% of Outstanding)
    // Note: Interest is usually calculated on the opening balance of the month
    const interestVal = Math.round(currentLoan * 0.01);

    // 4. Update Form (Only if fields are empty or auto-calculated, allows manual override)
    setFormData(prev => ({
      ...prev,
      interest: prev.interest === '' ? interestVal : prev.interest, // Only auto-fill if empty
      fine: prev.fine === '' ? fineVal : prev.fine
    }));

    // 5. Live Preview Stats
    const instAmt = parseFloat(formData.installment) || 0;
    setMemberLoanStats({
      outstanding: currentLoan,
      newBalance: currentLoan - instAmt
    });

  }, [formData.memberId, formData.date, formData.installment, members]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberSelect = (e) => {
    const memberId = e.target.value;
    const member = members.find(m => m.id === memberId);
    setFormData(prev => ({
      ...prev,
      memberId: memberId,
      memberName: member ? member.name : '',
      interest: '', // Reset to trigger auto-calc
      fine: ''      // Reset to trigger auto-calc
    }));
  };

  const getTotalAmount = () => {
    const dep = parseFloat(formData.deposit) || 0;
    const inst = parseFloat(formData.installment) || 0;
    const int = parseFloat(formData.interest) || 0;
    const fine = parseFloat(formData.fine) || 0;
    return dep + inst + int + fine;
  };

  // Submit Entry
  const handleSubmitEntry = async () => {
    const total = getTotalAmount();
    const instAmt = parseFloat(formData.installment) || 0;

    // 1. Insert into Passbook
    const { error: passbookError } = await supabase.from('passbook_entries').insert([{
      member_id: formData.memberId,
      member_name: formData.memberName,
      date: formData.date,
      payment_mode: formData.mode,
      deposit_amount: formData.deposit || 0,
      installment_amount: formData.installment || 0,
      interest_amount: formData.interest || 0,
      fine_amount: formData.fine || 0,
      total_amount: total,
      note: formData.note
    }]);

    if (passbookError) {
      alert('Error adding entry: ' + passbookError.message);
      return;
    }

    // 2. Update Member's Loan Balance (Decrease by Installment)
    if (instAmt > 0) {
      const member = members.find(m => m.id === formData.memberId);
      const newLoanBal = (member.outstanding_loan || 0) - instAmt;

      await supabase
        .from('members')
        .update({ outstanding_loan: newLoanBal })
        .eq('id', formData.memberId);
      
      // Refresh local member data
      fetchMembers();
    }

    setShowAddEntry(false);
    fetchEntries();
    // Reset Form
    setFormData({
      memberId: '', memberName: '', date: new Date().toISOString().split('T')[0],
      mode: 'Cash', deposit: '', installment: '', interest: '', fine: '', note: ''
    });
  };

  // Submit Loan Request
  const handleSubmitLoanRequest = async () => {
    const member = members.find(m => m.id === loanRequestData.memberId);
    
    const { error } = await supabase.from('loan_requests').insert([{
      member_id: loanRequestData.memberId,
      member_name: member ? member.name : 'Unknown',
      request_amount: loanRequestData.amount ? parseFloat(loanRequestData.amount) : null,
      status: 'pending'
    }]);

    if (error) alert('Error: ' + error.message);
    else {
      alert('Loan Request Sent!');
      setShowLoanRequest(false);
      setLoanRequestData({ memberId: '', amount: '' });
    }
  };

  // --- UI Components ---

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
            <p className="text-xs text-gray-500">Ledger Keeper</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entries', val: entries.length, icon: <Wallet size={20}/> },
          { label: 'Total Deposits', val: `₹${entries.reduce((a,b)=>a+(b.deposit_amount||0),0).toLocaleString()}`, icon: <Download size={20}/> },
          { label: 'Installments Collected', val: `₹${entries.reduce((a,b)=>a+(b.installment_amount||0),0).toLocaleString()}`, icon: <RefreshCw size={20}/> },
          { label: 'Total Interest', val: `₹${entries.reduce((a,b)=>a+(b.interest_amount||0),0).toLocaleString()}`, icon: <HandCoins size={20}/> },
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
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Download size={16}/> Export</button>
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
              {entries.filter(e => e.member_name?.toLowerCase().includes(searchTerm.toLowerCase())).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{entry.member_name}</td>
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
                    <button className="p-1 hover:text-blue-500"><Edit size={16}/></button>
                    <button className="p-1 hover:text-red-500"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: ADD ENTRY (SPLIT VIEW) --- */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            
            {/* Left: Input Form (Scrollable) */}
            <div className="w-full md:w-2/3 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Calculator size={24}/> Add New Entry</h2>
                <button onClick={() => setShowAddEntry(false)} className="md:hidden"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Member *</label>
                  <select name="memberId" className="w-full p-2 border rounded-lg bg-gray-50" onChange={handleMemberSelect} value={formData.memberId}>
                    <option value="">Select Member</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Deposit Date *</label>
                  <input type="date" name="date" className="w-full p-2 border rounded-lg" value={formData.date} onChange={handleInputChange} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Payment Mode</label>
                <select name="mode" className="w-full p-2 border rounded-lg" value={formData.mode} onChange={handleInputChange}>
                  <option>Cash</option>
                  <option>Online/UPI</option>
                  <option>Bank Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Deposit Amount</label>
                  <input type="number" name="deposit" placeholder="₹ 0" className="w-full p-2 border rounded-lg" value={formData.deposit} onChange={handleInputChange}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-600">Installment Amount</label>
                  <input type="number" name="installment" placeholder="₹ 0" className="w-full p-2 border rounded-lg border-blue-100 bg-blue-50" value={formData.installment} onChange={handleInputChange}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Interest (Auto 1%)</label>
                  <input type="number" name="interest" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.interest} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fine (Auto ₹10/day)</label>
                  <input type="number" name="fine" className="w-full p-2 border rounded-lg bg-gray-50" value={formData.fine} onChange={handleInputChange}/>
                </div>
              </div>

              <textarea name="note" placeholder="Add any additional notes..." className="w-full p-2 border rounded-lg mb-6 h-20" value={formData.note} onChange={handleInputChange}></textarea>

              <div className="flex gap-3">
                <button onClick={handleSubmitEntry} className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800">Create Entry</button>
                <button onClick={() => setShowAddEntry(false)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="hidden md:flex w-1/3 bg-gray-50 p-6 flex-col border-l">
              <div className="flex justify-between mb-8">
                <h3 className="font-semibold text-gray-500">Live Preview</h3>
                <button onClick={() => setShowAddEntry(false)}><X size={20}/></button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Member Info</p>
                <h2 className="text-xl font-bold text-gray-800">{formData.memberName || 'Select Member'}</h2>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Previous Loan:</span>
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

              <div className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg mt-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-2 rounded-full"><HandCoins size={20}/></div>
                  <span className="text-sm font-medium opacity-90">Total Payable Now</span>
                </div>
                <h1 className="text-4xl font-bold mb-1">₹ {getTotalAmount().toLocaleString()}</h1>
                <p className="text-xs opacity-75">Includes Deposit + Installment + Interest + Fine</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL: LOAN REQUEST --- */}
      {showLoanRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Wallet size={20} className="text-orange-500"/> Request New Loan</h2>
              <button onClick={() => setShowLoanRequest(false)}><X size={20}/></button>
            </div>

            <label className="block text-sm font-medium mb-1">Select Member *</label>
            <select className="w-full p-2 border rounded-lg mb-4" 
              value={loanRequestData.memberId}
              onChange={(e) => setLoanRequestData({...loanRequestData, memberId: e.target.value})}
            >
              <option value="">Choose Member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <label className="block text-sm font-medium mb-1">Loan Amount (Optional)</label>
            <input 
              type="number" 
              placeholder="Enter amount or leave empty" 
              className="w-full p-2 border rounded-lg mb-2"
              value={loanRequestData.amount}
              onChange={(e) => setLoanRequestData({...loanRequestData, amount: e.target.value})}
            />
            <p className="text-xs text-gray-500 mb-6">If not specified, admin will determine the loan amount later.</p>

            <div className="flex gap-3">
              <button onClick={() => setShowLoanRequest(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmitLoanRequest} className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">+ Send Request</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PassbookPage;