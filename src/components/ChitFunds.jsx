// src/components/ChitFunds.jsx
import { useState, useEffect } from 'react';

export default function ChitFunds({ pink, lightPink, softPink }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChitfunds, setUserChitfunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', phone: '', address: '' });

  const [showCreateChitModal, setShowCreateChitModal] = useState(false);
  const [currentUserForChit, setCurrentUserForChit] = useState(null);
  const [createChitForm, setCreateChitForm] = useState({
    chitfund_name: '', 
    chitfund_amount: '', 
    chitfund_duration: '12', 
    chitfund_type: 'GOLD'
  });

  const [selectedChitfund, setSelectedChitfund] = useState(null);
  const [chitTransactions, setChitTransactions] = useState([]);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentForm, setAddPaymentForm] = useState({ amount: '' });

  const API_BASE = 'http://localhost:3000';

  // Demo fallback data
  const demoUsers = [
    { _id: "user001", name: "Arjun Varma", phone: "9876543210", address: "Chennai" },
    { _id: "user002", name: "Meera Nair", phone: "9123456789", address: "Puducherry" },
    { _id: "user003", name: "Sneha Reddy", phone: "9988776655", address: "Bangalore" },
  ];

  const demoChitfunds = {
    "user001": [
      {
        _id: "chit001",
        chitfund_name: "Gold Premium",
        chitfund_amount: 50000,
        chitfund_duration: 12,
        months_paid: 3,
        is_completed: false,
        is_accepted: true,
        chitfund_transactions: [
          { _id: "txn001", amount: 50000, month_number: 1, payment_status: "PAID" },
          { _id: "txn002", amount: 50000, month_number: 2, payment_status: "PAID" },
          { _id: "txn003", amount: 50000, month_number: 3, payment_status: "UNPAID" },
        ]
      },
      {
        _id: "chit002",
        chitfund_name: "Silver Special",
        chitfund_amount: 30000,
        chitfund_duration: 12,
        months_paid: 0,
        is_completed: false,
        is_accepted: false,
        chitfund_transactions: []
      }
    ],
    "user002": [],
    "user003": []
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/chitfunds/users`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const allUsers = data.users || data || demoUsers;
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch {
      console.log("Using demo users");
      setUsers(demoUsers);
      setFilteredUsers(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChitfunds = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/chitfunds/users/${userId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUserChitfunds(data.chitfunds || data || []);
    } catch {
      console.log(`Using demo chitfunds for user ${userId}`);
      setUserChitfunds(demoChitfunds[userId] || []);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = users.filter(u =>
      u.name?.toLowerCase().includes(lower) ||
      u.phone?.includes(term) ||
      u.address?.toLowerCase().includes(lower)
    );
    setFilteredUsers(filtered);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserChitfunds(user._id);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setUserChitfunds([]);
    setSelectedChitfund(null);
    setChitTransactions([]);
  };

  const handleChitfundClick = (chit) => {
    if (!chit.is_accepted) return;
    setSelectedChitfund(chit);
    setChitTransactions(chit.chitfund_transactions || []);
  };

  const closeChitModal = () => {
    setSelectedChitfund(null);
    setChitTransactions([]);
  };

  // New: Accept Pending Request
  const acceptChitRequest = async (chitId) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/chitfunds/mark-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser._id,
          chitfund_id: chitId
        })
      });
      if (res.ok) {
        alert('✅ Request Accepted!');
        fetchUserChitfunds(selectedUser._id);
      } else throw new Error();
    } catch {
      setUserChitfunds(prev => prev.map(c => 
        c._id === chitId ? { ...c, is_accepted: true } : c
      ));
      alert('✅ Request Accepted (demo)');
    }
  };

  const openCreateChitModal = (user) => {
    setCurrentUserForChit(user);
    setCreateChitForm({ 
      chitfund_name: '', 
      chitfund_amount: '', 
      chitfund_duration: '12', 
      chitfund_type: 'GOLD' 
    });
    setShowCreateChitModal(true);
  };

  const handleCreateChitSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserForChit) return;

    const payload = {
      user_id: currentUserForChit._id,
      chitfund_name: createChitForm.chitfund_name,
      chitfund_amount: Number(createChitForm.chitfund_amount),
      chitfund_duration: Number(createChitForm.chitfund_duration),
      chitfund_type: createChitForm.chitfund_type
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/chitfunds/create-chit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('✅ Chitfund created successfully!');
        setShowCreateChitModal(false);
        if (selectedUser?._id === currentUserForChit._id) fetchUserChitfunds(selectedUser._id);
      } else throw new Error();
    } catch {
      const newChit = {
        _id: `chit_${Date.now()}`,
        ...payload,
        months_paid: 0,
        is_completed: false,
        is_accepted: true,
        chitfund_transactions: []
      };
      setUserChitfunds(prev => [...prev, newChit]);
      setShowCreateChitModal(false);
      alert('✅ Chitfund created (demo)');
    }
  };

  const openAddPaymentModal = () => {
    setAddPaymentForm({ amount: '' });
    setShowAddPaymentModal(true);
  };

  const handleAddPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChitfund || !selectedUser) return;

    const payload = {
      user_id: selectedUser._id,
      chitfund_id: selectedChitfund._id,
      amount: Number(addPaymentForm.amount)
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/chitfunds/add-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('✅ Payment recorded!');
        setShowAddPaymentModal(false);
        fetchUserChitfunds(selectedUser._id);
      } else throw new Error();
    } catch {
      const newTxn = {
        _id: `txn_${Date.now()}`,
        amount: Number(addPaymentForm.amount),
        month_number: (selectedChitfund.months_paid || 0) + 1,
        payment_status: "PAID"
      };
      setChitTransactions(prev => [...prev, newTxn]);
      setUserChitfunds(prev => prev.map(c => 
        c._id === selectedChitfund._id ? { ...c, months_paid: (c.months_paid || 0) + 1 } : c
      ));
      setShowAddPaymentModal(false);
      alert('✅ Payment added (demo)');
    }
  };

  const updatePaymentStatus = async (txnId, status) => {
    if (!selectedUser || !selectedChitfund) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/chitfund/payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser._id,
          chitfund_id: selectedChitfund._id,
          transaction_id: txnId,
          status
        })
      });

      if (res.ok) {
        alert(`✅ Status updated to ${status}`);
        fetchUserChitfunds(selectedUser._id);
      } else throw new Error();
    } catch {
      setChitTransactions(prev => prev.map(t => 
        t._id === txnId ? { ...t, payment_status: status } : t
      ));
      alert(`✅ Status updated to ${status} (demo)`);
    }
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', currency: 'INR', maximumFractionDigits: 0 
    }).format(amount || 0);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Chit Funds Management</h1>
          <p style={{ color: '#666', marginTop: '6px' }}>Active participants &amp; their chit subscriptions</p>
        </div>
        <button 
          onClick={() => setShowAddUserModal(true)} 
          style={{ padding: '14px 32px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Register New Participant
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search participants by name, phone..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ 
            flex: 1, maxWidth: '460px', padding: '16px 24px', borderRadius: '9999px', 
            border: `1px solid ${softPink}`, fontSize: '15.5px', outline: 'none',
            background: 'white', color: '#1f2937'
          }}
        />
        <div style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
          {filteredUsers.length} participants
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${softPink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: lightPink }}>
              <th style={{ padding: '20px 24px', textAlign: 'left' }}>Participant Name</th>
              <th style={{ padding: '20px 24px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '20px 24px', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Loading participants...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '80px', textAlign: 'center', color: '#888' }}>No participants found</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr 
                  key={user._id} 
                  onClick={() => handleUserClick(user)}
                  style={{ borderTop: `1px solid ${softPink}`, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = lightPink}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '20px 24px', fontWeight: '500' }}>{user.name}</td>
                  <td style={{ padding: '20px 24px' }}>{user.phone}</td>
                  <td style={{ padding: '20px 24px', color: '#666' }}>{user.address}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openCreateChitModal(user); }}
                      style={{ background: 'none', border: 'none', fontSize: '24px', color: '#831843', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* USER CHITFUNDS MODAL - UPDATED */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={closeUserModal}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1100px', maxHeight: '92vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${softPink}` }}>
              <div>
                <div style={{ fontSize: '26px', fontWeight: '700' }}>{selectedUser.name}</div>
                <div style={{ fontSize: '15px', color: '#666' }}>{selectedUser.phone} • {selectedUser.address}</div>
              </div>
              <button onClick={closeUserModal} style={{ fontSize: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#831843' }}>×</button>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Chit Funds</h3>
                <button 
                  onClick={() => openCreateChitModal(selectedUser)} 
                  style={{ padding: '10px 24px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600' }}
                >
                  + Create New Chit
                </button>
              </div>

              {userChitfunds.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#888', background: lightPink, borderRadius: '16px' }}>
                  No chit funds yet. Create one above.
                </div>
              ) : (
                userChitfunds.map(chit => (
                  <div 
                    key={chit._id} 
                    onClick={() => handleChitfundClick(chit)}
                    style={{ 
                      border: `1px solid ${softPink}`, borderRadius: '16px', padding: '24px', 
                      marginBottom: '16px', cursor: chit.is_accepted ? 'pointer' : 'default', 
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => chit.is_accepted && (e.currentTarget.style.borderColor = pink)}
                    onMouseLeave={e => chit.is_accepted && (e.currentTarget.style.borderColor = softPink)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600' }}>{chit.chitfund_name}</div>
                        <div style={{ color: '#666', marginTop: '4px' }}>{chit.chitfund_type} • ₹{chit.chitfund_amount}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontSize: '15px', color: chit.is_completed ? '#22c55e' : '#f59e0b' }}>
                          {chit.is_completed ? 'COMPLETED' : `${chit.months_paid || 0} / ${chit.chitfund_duration || 12} months`}
                        </div>
                        
                        {!chit.is_accepted ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); acceptChitRequest(chit._id); }}
                            style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '14px', fontWeight: '600' }}
                          >
                            Accept Request
                          </button>
                        ) : (
                          <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '13px' }}>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHIT TRANSACTIONS MODAL */}
      {selectedChitfund && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={closeChitModal}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '92vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${softPink}` }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{selectedChitfund.chitfund_name}</div>
                <div style={{ color: '#666' }}>{selectedUser.name}</div>
              </div>
              <button onClick={closeChitModal} style={{ fontSize: '34px', background: 'none', border: 'none', color: '#831843' }}>×</button>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3>Transactions</h3>
                <button onClick={openAddPaymentModal} style={{ padding: '10px 24px', background: pink, color: 'white', border: 'none', borderRadius: '9999px' }}>
                  + Add Payment
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: lightPink }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left' }}>Txn ID</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Month</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chitTransactions.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#888' }}>No transactions yet</td></tr>
                  ) : (
                    chitTransactions.map(txn => (
                      <tr key={txn._id} style={{ borderTop: `1px solid ${softPink}` }}>
                        <td style={{ padding: '18px 20px' }}>{txn._id}</td>
                        <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>{txn.month_number}</td>
                        <td style={{ padding: '18px 20px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(txn.amount)}</td>
                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                          <span 
                            onClick={() => txn.payment_status === 'UNPAID' && updatePaymentStatus(txn._id, 'PAID')}
                            style={{ 
                              padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600', 
                              cursor: txn.payment_status === 'UNPAID' ? 'pointer' : 'default',
                              background: txn.payment_status === 'PAID' ? '#dcfce7' : '#fee2e2',
                              color: txn.payment_status === 'PAID' ? '#166534' : '#b91c1c'
                            }}
                          >
                            {txn.payment_status}
                          </span>
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

      {/* CREATE CHIT MODAL */}
      {showCreateChitModal && currentUserForChit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowCreateChitModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '460px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1f2937' }}>New Chit Fund for {currentUserForChit.name}</h2>
            <form onSubmit={handleCreateChitSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Chit Name</label>
                <input type="text" value={createChitForm.chitfund_name} onChange={e => setCreateChitForm({...createChitForm, chitfund_name: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Amount (₹)</label>
                <input type="number" value={createChitForm.chitfund_amount} onChange={e => setCreateChitForm({...createChitForm, chitfund_amount: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Duration (months)</label>
                <input type="number" value={createChitForm.chitfund_duration} onChange={e => setCreateChitForm({...createChitForm, chitfund_duration: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Type</label>
                <select value={createChitForm.chitfund_type} onChange={e => setCreateChitForm({...createChitForm, chitfund_type: e.target.value})} style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937' }}>
                  <option value="GOLD">GOLD</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowCreateChitModal(false)} style={{ flex: 1, padding: '14px', background: 'white', color: '#1f2937', border: `2px solid ${softPink}`, borderRadius: '9999px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px' }}>Create Chit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {showAddPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowAddPaymentModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '420px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1f2937' }}>Add Payment</h2>
            <form onSubmit={handleAddPaymentSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>Amount (₹)</label>
                <input type="number" value={addPaymentForm.amount} onChange={e => setAddPaymentForm({amount: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', fontSize: '18px' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddPaymentModal(false)} style={{ flex: 1, padding: '14px', background: 'white', border: `2px solid ${softPink}`, borderRadius: '9999px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px' }}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowAddUserModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '460px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1f2937' }}>Register New Participant</h2>
            <form onSubmit={(e) => { e.preventDefault(); alert('✅ Participant registered (demo)'); setShowAddUserModal(false); }}>
              <input type="text" placeholder="Full Name" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} style={{background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'16px', border:`2px solid ${softPink}`, borderRadius:'12px'}} required />
              <input type="tel" placeholder="Phone Number" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} style={{ background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'16px', border:`2px solid ${softPink}`, borderRadius:'12px'}} required />
              <input type="text" placeholder="Address" value={newUserForm.address} onChange={e => setNewUserForm({...newUserForm, address: e.target.value})} style={{background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'24px', border:`2px solid ${softPink}`, borderRadius:'12px'}} required />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{flex:1, padding:'14px', background:'white', color: '#1f2937', border:`2px solid ${softPink}`, borderRadius:'9999px'}}>Cancel</button>
                <button type="submit" style={{flex:1, padding:'14px', background: pink, color:'white', border:'none', borderRadius:'9999px'}}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}