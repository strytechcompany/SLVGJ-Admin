// src/components/Dealers.jsx
import { useState, useEffect } from 'react';

export default function Dealers({ pink, lightPink, softPink }) {
  const [dealers, setDealers] = useState([]);
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [dealerTransactions, setDealerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalDebt] = useState(14285250);
  const [totalCredit] = useState(8212000);
 

  // Modals
  const [showAddDealerModal, setShowAddDealerModal] = useState(false);
  const [newDealerForm, setNewDealerForm] = useState({
    dealer_id: '', name: '', phone: '', address: ''
  });

  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [currentDealerForAddTrans, setCurrentDealerForAddTrans] = useState(null);
  const [addTransForm, setAddTransForm] = useState({
    type: 'DEBT', gram: '', description: ''
  });

  const [showUpdateTransactionModal, setShowUpdateTransactionModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [updateTransForm, setUpdateTransForm] = useState({
    type: 'DEBT', gram: '', description: ''
  });

  const API_BASE = 'http://localhost:3000';

  // Demo data
  const demoDealersData = [
    { dealer_id: "DL-40291", name: "Rajesh Sharma", phone: "9876543210", address: "Mumbai Metro" },
    { dealer_id: "DL-40315", name: "Priya Kapoor", phone: "9123456789", address: "New Delhi Central" },
    { dealer_id: "DL-40288", name: "Anil Mehta", phone: "9988776655", address: "Bangalore South" },
    { dealer_id: "DL-40552", name: "Suresh Nair", phone: "9845678901", address: "Chennai Hub" },
    { dealer_id: "DL-40112", name: "Vikram Gupta", phone: "9765432109", address: "Kolkata East" }
  ];

  const demoTransactionsData = {
    "DL-40291": [
      { transaction_id: "TX-1001", dealer_id: "DL-40291", date: "2026-04-03", type: "DEBT", gram: 250, description: "Gold bar purchase - 24K" },
      { transaction_id: "TX-1002", dealer_id: "DL-40291", date: "2026-04-02", type: "CREDIT", gram: 120, description: "Silver coin return" }
    ],
    "DL-40315": [{ transaction_id: "TX-1003", dealer_id: "DL-40315", date: "2026-04-01", type: "DEBT", gram: 180, description: "Gold chain bulk order" }],
    "DL-40288": [{ transaction_id: "TX-1004", dealer_id: "DL-40288", date: "2026-03-30", type: "CREDIT", gram: 95, description: "Chit fund settlement" }],
    "DL-40552": [],
    "DL-40112": [{ transaction_id: "TX-1005", dealer_id: "DL-40112", date: "2026-04-03", type: "DEBT", gram: 310, description: "Gold jewellery consignment" }]
  };

  useEffect(() => {
    fetchAllDealers();
  }, []);

  const fetchAllDealers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/get-dealers`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const allDealers = data.dealers || data || [];
      setDealers(allDealers);
      setFilteredDealers(allDealers);
    
    } catch {
      setDealers(demoDealersData);
      setFilteredDealers(demoDealersData);
      
    } finally {
      setLoading(false);
    }
  };

  const fetchDealerTransactions = async (dealerId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/get-transactions`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const allTrans = data.transactions || data || [];
      setDealerTransactions(allTrans.filter(t => t.dealer_id === dealerId));
    } catch {
      setDealerTransactions(demoTransactionsData[dealerId] || []); 
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredDealers(dealers);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = dealers.filter(d =>
      d.dealer_id?.toLowerCase().includes(lower) ||
      d.name?.toLowerCase().includes(lower) ||
      d.phone?.includes(term) ||
      d.address?.toLowerCase().includes(lower)
    );
    setFilteredDealers(filtered);
  };

  const handleRowClick = (dealer) => {
    setSelectedDealer(dealer);
    fetchDealerTransactions(dealer.dealer_id);
  };

  const closeModal = () => {
    setSelectedDealer(null);
    setDealerTransactions([]);
  };

  const handleAddDealerSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/add-dealer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDealerForm)
      });
      if (res.ok) {
        alert('✅ Dealer added successfully!');
        setShowAddDealerModal(false);
        setNewDealerForm({ dealer_id: '', name: '', phone: '', address: '' });
        fetchAllDealers();
      } else throw new Error();
    } catch {
      const newDealer = { ...newDealerForm, dealer_id: newDealerForm.dealer_id || `DL-${Math.floor(40000 + Math.random()*10000)}` };
      setDealers(prev => [...prev, newDealer]);
      setFilteredDealers(prev => [...prev, newDealer]);
      setShowAddDealerModal(false);
      setNewDealerForm({ dealer_id: '', name: '', phone: '', address: '' });
      alert('✅ Dealer added (demo)');
    }
  };

  const openAddTransactionModal = (dealer) => {
    setCurrentDealerForAddTrans(dealer);
    setAddTransForm({ type: 'DEBT', gram: '', description: '' });
    setShowAddTransactionModal(true);
  };

  const handleAddTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!currentDealerForAddTrans) return;
    const payload = {
      dealer_id: currentDealerForAddTrans.dealer_id,
      type: addTransForm.type,
      gram: Number(addTransForm.gram),
      description: addTransForm.description
    };
    try {
      const res = await fetch(`${API_BASE}/api/admin/add-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('✅ Transaction added!');
        setShowAddTransactionModal(false);
        if (selectedDealer?.dealer_id === currentDealerForAddTrans.dealer_id) fetchDealerTransactions(selectedDealer.dealer_id);
      } else throw new Error();
    } catch {
      const demoTrans = {
        transaction_id: `TX-${1000 + Math.floor(Math.random()*9000)}`,
        dealer_id: currentDealerForAddTrans.dealer_id,
        date: new Date().toISOString().split('T')[0],
        type: addTransForm.type,
        gram: Number(addTransForm.gram),
        description: addTransForm.description
      };
      setDealerTransactions(prev => [...prev, demoTrans]);
      setShowAddTransactionModal(false);
      alert('✅ Transaction added (demo)');
    }
  };

  const openUpdateTransactionModal = (trans) => {
    setCurrentTransaction(trans);
    setUpdateTransForm({ type: trans.type, gram: trans.gram, description: trans.description });
    setShowUpdateTransactionModal(true);
  };

  const handleUpdateTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!currentTransaction) return;
    const payload = {
      transaction_id: currentTransaction.transaction_id,
      type: updateTransForm.type,
      gram: Number(updateTransForm.gram),
      description: updateTransForm.description
    };
    try {
      const res = await fetch(`${API_BASE}/api/admin/update-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('✅ Transaction updated!');
        setShowUpdateTransactionModal(false);
        if (selectedDealer) fetchDealerTransactions(selectedDealer.dealer_id);
      } else throw new Error();
    } catch {
      setDealerTransactions(prev =>
        prev.map(t => t.transaction_id === currentTransaction.transaction_id ? { ...t, ...updateTransForm, gram: Number(updateTransForm.gram) } : t)
      );
      setShowUpdateTransactionModal(false);
      alert('✅ Transaction updated (demo)');
    }
  };

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header + Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Dealers Financials</h1>
          <p style={{ color: '#666', marginTop: '6px' }}>Monitoring dealer liabilities and transaction history across all regions.</p>
        </div>
        <button onClick={() => setShowAddDealerModal(true)} style={{ padding: '14px 32px', background: '#d97706', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>+</span> Register New Dealer
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px 26px', border: `1px solid ${softPink}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>↓</div>
            <div>
              <div style={{ fontSize: '15px', color: '#ff0000', fontWeight: '600' }}>TOTAL DEBT</div>
              <div style={{ fontSize: '42px', fontWeight: '700', color: '#ff0000' }}>{formatCurrency(totalDebt)}</div>
              
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px 26px', border: `1px solid ${softPink}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#dbeafe', color: '#3b82f6', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>↑</div>
            <div>
              <div style={{ fontSize: '15px', color: '#006c09', fontWeight: '600' }}>TOTAL CREDIT</div>
              <div style={{ fontSize: '42px', fontWeight: '700', color:'#006c09' }}>{formatCurrency(totalCredit)}</div>
              
            </div>
          </div>
        </div>
       
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search dealers by Dealer ID, Name or Phone number..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, maxWidth: '460px', padding: '16px 24px', borderRadius: '9999px', border: `1px solid ${softPink}`, fontSize: '15.5px', outline: 'none', background: 'white', color: '#333' }}
        />
        <div style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
          {filteredDealers.length} of {dealers.length} dealers
        </div>
      </div>

      {/* Dealers Table */}
      <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${softPink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: lightPink }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Dealer ID</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Dealer Name</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Address</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Phone</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Loading dealers...</td></tr>
            ) : filteredDealers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#888' }}>No dealers found</td></tr>
            ) : (
              filteredDealers.map(dealer => (
                <tr key={dealer.dealer_id} onClick={() => handleRowClick(dealer)} style={{ borderTop: `1px solid ${softPink}`, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = lightPink} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                  <td style={{ padding: '20px 24px', fontWeight: '600' }}>{dealer.dealer_id}</td>
                  <td style={{ padding: '20px 24px', fontWeight: '500' }}>{dealer.name}</td>
                  <td style={{ padding: '20px 24px', color: '#666' }}>{dealer.address}</td>
                  <td style={{ padding: '20px 24px', color: '#555' }}>{dealer.phone}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <button onClick={(e) => { e.stopPropagation(); openAddTransactionModal(dealer); }} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#831843' }}>⋮</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TRANSACTIONS MODAL */}
      {selectedDealer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={closeModal}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1100px', maxHeight: '92vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${softPink}` }}>
              <div>
                <div style={{ fontSize: '26px', fontWeight: '700' }}>{selectedDealer.name}</div>
                <div style={{ fontSize: '15px', color: '#666' }}>ID: {selectedDealer.dealer_id} • {selectedDealer.address}</div>
              </div>
              <button onClick={closeModal} style={{ fontSize: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#831843' }}>×</button>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600' }}>All Transactions</h3>
                <button onClick={() => openAddTransactionModal(selectedDealer)} style={{ padding: '10px 24px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600' }}>+ Add Transaction</button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: lightPink }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Type</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Gram</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left' }}>Description</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dealerTransactions.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#888' }}>No transactions yet</td></tr>
                  ) : (
                    dealerTransactions.map(trans => (
                      <tr key={trans.transaction_id} style={{ borderTop: `1px solid ${softPink}` }}>
                        <td style={{ padding: '18px 20px', fontWeight: '500' }}>{trans.transaction_id}</td>
                        <td style={{ padding: '18px 20px', color: '#666' }}>{formatDate(trans.date)}</td>
                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 14px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600', background: trans.type === 'DEBT' ? '#fee2e2' : '#dbeafe', color: trans.type === 'DEBT' ? '#ef4444' : '#3b82f6' }}>{trans.type}</span>
                        </td>
                        <td style={{ padding: '18px 20px', textAlign: 'right', fontWeight: '600' }}>{trans.gram}g</td>
                        <td style={{ padding: '18px 20px', color: '#555' }}>{trans.description}</td>
                        <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                          <button onClick={(e) => { e.stopPropagation(); openUpdateTransactionModal(trans); }} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#831843' }}>⋮</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD DEALER MODAL - FIXED */}
      {showAddDealerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddDealerModal(false); }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '480px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px', color: '#1f2937' }}>Register New Dealer</h2>
            <form onSubmit={handleAddDealerSubmit}>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Dealer ID</label><input type="text" value={newDealerForm.dealer_id} onChange={e => setNewDealerForm({ ...newDealerForm, dealer_id: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Dealer Name</label><input type="text" value={newDealerForm.name} onChange={e => setNewDealerForm({ ...newDealerForm, name: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required /></div>
              <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Phone Number</label><input type="tel" value={newDealerForm.phone} onChange={e => setNewDealerForm({ ...newDealerForm, phone: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required /></div>
              <div style={{ marginBottom: '24px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Address / Region</label><input type="text" value={newDealerForm.address} onChange={e => setNewDealerForm({ ...newDealerForm, address: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required /></div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddDealerModal(false)} style={{ flex: 1, padding: '14px', background: 'white', border: `2px solid ${softPink}`, borderRadius: '9999px', color: '#831843', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600' }}>Register Dealer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRANSACTION MODAL - FIXED */}
      {showAddTransactionModal && currentDealerForAddTrans && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddTransactionModal(false); }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '460px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '8px' }}>Add Transaction</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>for {currentDealerForAddTrans.name}</p>
            <form onSubmit={handleAddTransactionSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Type</label>
                <select value={addTransForm.type} onChange={e => setAddTransForm({ ...addTransForm, type: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }}>
                  <option value="DEBT">DEBT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Grams</label>
                <input type="number" value={addTransForm.gram} onChange={e => setAddTransForm({ ...addTransForm, gram: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
                <textarea value={addTransForm.description} onChange={e => setAddTransForm({ ...addTransForm, description: e.target.value })} rows="3" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddTransactionModal(false)} style={{ flex: 1, padding: '14px', background: 'white', border: `2px solid ${softPink}`, borderRadius: '9999px', color: '#831843' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px' }}>Add Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE TRANSACTION MODAL - FIXED */}
      {showUpdateTransactionModal && currentTransaction && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateTransactionModal(false); }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '460px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>Update Transaction</h2>
            <form onSubmit={handleUpdateTransactionSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Type</label>
                <select value={updateTransForm.type} onChange={e => setUpdateTransForm({ ...updateTransForm, type: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }}>
                  <option value="DEBT">DEBT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Grams</label>
                <input type="number" value={updateTransForm.gram} onChange={e => setUpdateTransForm({ ...updateTransForm, gram: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description</label>
                <textarea value={updateTransForm.description} onChange={e => setUpdateTransForm({ ...updateTransForm, description: e.target.value })} rows="3" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#333' }} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowUpdateTransactionModal(false)} style={{ flex: 1, padding: '14px', background: 'white', border: `2px solid ${softPink}`, borderRadius: '9999px', color: '#831843' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px' }}>Update Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}