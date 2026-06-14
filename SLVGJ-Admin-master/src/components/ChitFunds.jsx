// src/components/ChitFunds.jsx
import React, { useState, useEffect } from 'react';

export default function ChitFunds({ pink, lightPink, softPink }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChitfunds, setUserChitfunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', phone: '', email: '', address: '', password: '' });

  const [showCreateChitModal, setShowCreateChitModal] = useState(false);
  const [currentUserForChit, setCurrentUserForChit] = useState(null);
  const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [createChitForm, setCreateChitForm] = useState({
    chitfund_name: '',
    chitfund_amount: '',
    chitfund_duration: '12',
    chitfund_type: 'GOLD',
    start_month: ''
  });

  const [selectedChitfund, setSelectedChitfund] = useState(null);
  const [chitTransactions, setChitTransactions] = useState([]);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentForm, setAddPaymentForm] = useState({ amount: '', payment_month: '' });
  const [paymentError, setPaymentError] = useState('');
  const [goldRate, setGoldRate] = useState(0);

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
    fetchGoldRate();
  }, []);

  const fetchGoldRate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/get-rate`);
      const data = await res.json();
      if (data.gold_rate?.rate) setGoldRate(data.gold_rate.rate);
    } catch (e) {}
  };

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

  useEffect(() => {
    if (selectedChitfund && userChitfunds.length > 0) {
      const updated = userChitfunds.find(c => c._id === selectedChitfund._id);
      if (updated) {
        setSelectedChitfund(updated);
        setChitTransactions(updated.chitfund_transactions || []);
      }
    }
  }, [userChitfunds]);

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
    if (chit.status !== "ACCEPTED") return;
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
          chitfund_id: chitId,
          isAccepted: true
        })
      });
      if (res.ok) {
        alert('✅ Request Accepted!');
        fetchUserChitfunds(selectedUser._id);
      } else throw new Error();
    } catch {
      setUserChitfunds(prev => prev.map(c =>
        c._id === chitId ? { ...c, status: "ACCEPTED" } : c
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
      chitfund_type: 'GOLD',
      start_month: ''
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
      chitfund_type: createChitForm.chitfund_type,
      start_month: createChitForm.start_month
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
        status: "ACCEPTED",
        chitfund_transactions: []
      };
      setUserChitfunds(prev => [...prev, newChit]);
      setShowCreateChitModal(false);
      alert('✅ Chitfund created (demo)');
    }
  };

  const openAddPaymentModal = () => {
    setAddPaymentForm({ amount: selectedChitfund ? selectedChitfund.chitfund_amount : '', payment_month: '' });
    setPaymentError('');
    setShowAddPaymentModal(true);
  };

  const handleAddPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChitfund || !selectedUser) return;
    setPaymentError('');

    const payload = {
      user_id: selectedUser._id,
      chitfund_id: selectedChitfund._id,
      amount: Number(addPaymentForm.amount),
      payment_month: addPaymentForm.payment_month
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/chitfunds/add-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setShowAddPaymentModal(false);
        setPaymentError('');
        // Re-fetch the chit fund user data to get updated transactions
        await fetchUserChitfunds(selectedUser._id);
      } else {
        // Show the backend error in the modal
        setPaymentError(data.error || 'Payment failed. Please try again.');
      }
    } catch {
      setPaymentError('Could not connect to server. Please try again.');
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

  const handleRegisterParticipant = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/admin/chitfunds/users_register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserForm.name,
          phone: newUserForm.phone,
          email: newUserForm.email,
          address: newUserForm.address,
          password: newUserForm.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert('✅ Participant registered successfully!');
        setShowAddUserModal(false);
        setNewUserForm({ name: '', phone: '', email: '', address: '', password: '' });
        fetchAllUsers();
      } else {
        alert(`❌ Error: ${data.error || 'Failed to register'}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error connecting to server');
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
                <React.Fragment key={user._id}>
                  <tr
                    onClick={() => selectedUser?._id === user._id ? closeUserModal() : handleUserClick(user)}
                    style={{ borderTop: `1px solid ${softPink}`, cursor: 'pointer', background: selectedUser?._id === user._id ? lightPink : 'white' }}
                    onMouseEnter={e => { if(selectedUser?._id !== user._id) e.currentTarget.style.backgroundColor = lightPink; }}
                    onMouseLeave={e => { if(selectedUser?._id !== user._id) e.currentTarget.style.backgroundColor = 'white'; }}
                  >
                    <td style={{ padding: '20px 24px', fontWeight: '500' }}>{user.name}</td>
                    <td style={{ padding: '20px 24px' }}>{user.phone}</td>
                    <td style={{ padding: '20px 24px', color: '#666' }}>{user.address}</td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreateChitModal(user); }}
                        style={{ background: 'none', border: 'none', fontSize: '24px', color: '#831843', cursor: 'pointer', marginRight: '16px' }}
                        title="Create New Chit"
                      >
                        +
                      </button>
                      <span style={{ color: pink, fontWeight: 'bold' }}>
                        {selectedUser?._id === user._id ? '▲' : '▼'}
                      </span>
                    </td>
                  </tr>

                  {selectedUser?._id === user._id && (
                    <tr>
                      <td colSpan="4" style={{ padding: 0, background: '#fafafa', borderBottom: `2px solid ${pink}` }}>
                        <div style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#333' }}>Active Chit Funds for {user.name}</h3>
                          </div>

                          {userChitfunds.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#888', background: 'white', borderRadius: '12px', border: '1px dashed #ccc' }}>
                              No chit funds yet. Create one by clicking the + button.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                              {userChitfunds.map(chit => (
                                <div
                                  key={chit._id}
                                  onClick={() => handleChitfundClick(chit)}
                                  style={{
                                    background: 'white', border: `1px solid ${softPink}`, borderRadius: '12px', padding: '20px',
                                    cursor: chit.status === "ACCEPTED" ? 'pointer' : 'default',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => chit.status === "ACCEPTED" && (e.currentTarget.style.borderColor = pink)}
                                  onMouseLeave={e => chit.status === "ACCEPTED" && (e.currentTarget.style.borderColor = softPink)}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                    <div>
                                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>{chit.chitfund_name}</div>
                                      <div style={{ color: '#666', marginTop: '2px', fontSize: '13px' }}>{chit.chitfund_type} • ₹{chit.chitfund_amount}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      {chit.status !== "ACCEPTED" ? (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); acceptChitRequest(chit._id); }}
                                          style={{ padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                          Accept Request
                                        </button>
                                      ) : (
                                        <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold' }}>
                                          ACTIVE
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                      <span style={{ color: '#64748b' }}>Duration:</span>
                                      <span style={{ fontWeight: '600', color: '#334155' }}>{chit.chitfund_duration} Months</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                      <span style={{ color: '#64748b' }}>Months Paid:</span>
                                      <span style={{ fontWeight: '600', color: chit.is_completed ? '#16a34a' : '#e11d8a' }}>{chit.chitfund_transactions ? chit.chitfund_transactions.filter(t => t.payment_status === 'PAID').length : (chit.months_paid || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                      <span style={{ color: '#64748b' }}>Status:</span>
                                      {(() => {
                                        const paidCount = chit.chitfund_transactions ? chit.chitfund_transactions.filter(t => t.payment_status === 'PAID').length : (chit.months_paid || 0);
                                        const isDurationMet = paidCount >= chit.chitfund_duration;
                                        const isCompleted = isDurationMet && chit.product_issued;
                                        
                                        return (
                                          <span style={{ fontWeight: '600', color: isCompleted ? '#16a34a' : (isDurationMet ? '#e11d8a' : '#f59e0b') }}>
                                            {isCompleted ? 'COMPLETED' : (isDurationMet ? 'PENDING ISSUE' : 'IN PROGRESS')}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    {chit.chitfund_type === 'GOLD' && (() => {
                                      const txns = chit.chitfund_transactions || [];
                                      // Use stored cumulative_grams from last txn, or calculate from amount if missing
                                      let cumGrams = 0;
                                      if (txns.length > 0) {
                                        const lastTxn = txns[txns.length - 1];
                                        if (lastTxn.cumulative_grams > 0) {
                                          cumGrams = lastTxn.cumulative_grams;
                                        } else if (goldRate > 0) {
                                          cumGrams = txns.reduce((sum, t) => sum + (t.amount || 0), 0) / goldRate;
                                        }
                                      }
                                      return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                          <span style={{ color: '#64748b', fontWeight: '600' }}>🪙 Cum. Gold Grams:</span>
                                          <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '14px' }}>{cumGrams.toFixed(3)}g</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  {chit.status === "ACCEPTED" && (
                                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: pink, fontWeight: '600' }}>
                                      Click to view/add transactions &rarr;
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>


      {/* CHIT TRANSACTIONS MODAL */}
      {selectedChitfund && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, pointerEvents: showAddPaymentModal ? 'none' : 'auto' }} onClick={closeChitModal}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '92vh', overflow: 'auto', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
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
                {(() => {
                  const txnsPaidCount = chitTransactions.filter(t => t.payment_status === 'PAID').length;
                  const isDurationMet = txnsPaidCount >= selectedChitfund.chitfund_duration;
                  return (
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {isDurationMet ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>Product Status:</span>
                          <select 
                            id="productStatusSelect"
                            defaultValue={selectedChitfund.product_issued ? 'ISSUED' : 'NOT_ISSUED'}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${softPink}`, outline: 'none', cursor: 'pointer', background: 'white', color: '#1f2937', fontWeight: '600' }}
                          >
                            <option value="NOT_ISSUED">Not Issued</option>
                            <option value="ISSUED">Issued Product</option>
                          </select>
                          <button
                            onClick={async () => {
                              const val = document.getElementById('productStatusSelect').value;
                              const product_issued = val === 'ISSUED';
                              const res = await fetch(`${API_BASE}/api/admin/chitfunds/update-product-status`, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chitfund_id: selectedChitfund._id, product_issued })
                              });
                              if(res.ok) {
                                await fetchUserChitfunds(selectedUser._id);
                                closeChitModal();
                              }
                            }}
                            style={{ padding: '8px 16px', background: pink, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button onClick={openAddPaymentModal} style={{ padding: '10px 24px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}>
                          + Add Payment
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: lightPink }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left' }}>Txn ID</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Month</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', color: '#16a34a' }}>Grams</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', color: '#16a34a' }}>Cum. Grams</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chitTransactions.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#888' }}>No transactions yet</td></tr>
                  ) : (() => {
                    // Build grams for each txn on the fly if not stored
                    let runningCumGrams = 0;
                    return chitTransactions.map(txn => {
                      const txnGrams = (txn.grams && txn.grams > 0)
                        ? txn.grams
                        : (goldRate > 0 && selectedChitfund?.chitfund_type === 'GOLD' ? txn.amount / goldRate : 0);
                      const cumGrams = (txn.cumulative_grams && txn.cumulative_grams > 0)
                        ? txn.cumulative_grams
                        : (runningCumGrams += txnGrams, runningCumGrams);
                      if (txn.cumulative_grams && txn.cumulative_grams > 0) runningCumGrams = txn.cumulative_grams;
                      return (
                        <tr key={txn._id} style={{ borderTop: `1px solid ${softPink}` }}>
                          <td style={{ padding: '18px 20px', fontSize: '12px', color: '#888' }}>{txn._id?.slice(-10)}...</td>
                          <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '600' }}>{txn.month_name} {txn.year}</td>
                          <td style={{ padding: '18px 20px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(txn.amount)}</td>
                          <td style={{ padding: '18px 20px', textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>{txnGrams.toFixed(3)}g</td>
                          <td style={{ padding: '18px 20px', textAlign: 'right', color: '#16a34a', fontWeight: 'bold' }}>{cumGrams.toFixed(3)}g</td>
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
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CHIT MODAL */}
      {showCreateChitModal && currentUserForChit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, pointerEvents: 'auto' }} onClick={() => setShowCreateChitModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '460px', padding: '32px', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1f2937' }}>New Chit Fund for {currentUserForChit.name}</h2>
            <form onSubmit={handleCreateChitSubmit} style={{ pointerEvents: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Chit Name</label>
                <input type="text" value={createChitForm.chitfund_name} onChange={e => setCreateChitForm({...createChitForm, chitfund_name: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', pointerEvents: 'auto' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Amount (₹)</label>
                <input type="number" value={createChitForm.chitfund_amount} onChange={e => setCreateChitForm({...createChitForm, chitfund_amount: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', pointerEvents: 'auto' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Duration (months)</label>
                <input type="number" value={createChitForm.chitfund_duration} onChange={e => setCreateChitForm({...createChitForm, chitfund_duration: e.target.value})} required style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', pointerEvents: 'auto' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Type</label>
                <select value={createChitForm.chitfund_type} onChange={e => setCreateChitForm({...createChitForm, chitfund_type: e.target.value})} style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', pointerEvents: 'auto' }}>
                  <option value="GOLD">GOLD</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Start Month & Year</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select 
                    value={createChitForm.start_month.split('-')[1] || ''} 
                    onChange={e => {
                      const currentYear = new Date().getFullYear();
                      const year = createChitForm.start_month.split('-')[0] || currentYear;
                      setCreateChitForm({...createChitForm, start_month: `${year}-${e.target.value}`});
                    }} 
                    required 
                    style={{ flex: 1, padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', outline: 'none', pointerEvents: 'auto' }}
                  >
                    <option value="" disabled>Select Month</option>
                    <option value="01">January</option><option value="02">February</option>
                    <option value="03">March</option><option value="04">April</option>
                    <option value="05">May</option><option value="06">June</option>
                    <option value="07">July</option><option value="08">August</option>
                    <option value="09">September</option><option value="10">October</option>
                    <option value="11">November</option><option value="12">December</option>
                  </select>
                  <select 
                    value={createChitForm.start_month.split('-')[0] || ''} 
                    onChange={e => {
                      const month = createChitForm.start_month.split('-')[1] || '01';
                      setCreateChitForm({...createChitForm, start_month: `${e.target.value}-${month}`});
                    }} 
                    required 
                    style={{ flex: 1, padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', outline: 'none', pointerEvents: 'auto' }}
                  >
                    <option value="" disabled>Select Year</option>
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, pointerEvents: 'auto' }} onClick={() => { setShowAddPaymentModal(false); setPaymentError(''); }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '440px', padding: '32px', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1f2937', marginTop: 0 }}>Add Payment</h2>

            {/* Already-paid months pill list */}
            {(() => {
              const paidMonths = (selectedChitfund?.chitfund_transactions || []).map(t => t.month_name + ' ' + t.year);
              if (paidMonths.length === 0) return null;
              return (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Already Paid Months</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {paidMonths.map((m, i) => (
                      <span key={i} style={{ padding: '3px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>✓ {m}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Error message */}
            {paymentError && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', color: '#b91c1c', fontWeight: '600', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>⛔</span> {paymentError}
              </div>
            )}

            <form onSubmit={handleAddPaymentSubmit} style={{ pointerEvents: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>Payment Month &amp; Year</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {(() => {
                    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                    
                    let options = [];
                    let duration = selectedChitfund?.chitfund_duration || 12;
                    let startMonthIndex = 0;
                    let startYear = new Date().getFullYear();
                    
                    if (selectedChitfund?.start_month && selectedChitfund?.start_year) {
                      startMonthIndex = monthNames.indexOf(selectedChitfund.start_month);
                      startYear = selectedChitfund.start_year;
                    } else if (selectedChitfund?.start_date) {
                      const d = new Date(selectedChitfund.start_date);
                      startMonthIndex = d.getMonth();
                      startYear = d.getFullYear();
                    }

                    let currentMonth = startMonthIndex;
                    let currentYear = startYear;

                    for (let i = 0; i < duration; i++) {
                      const monthStr = String(currentMonth + 1).padStart(2, '0');
                      const value = `${currentYear}-${monthStr}`;
                      const label = `${monthNames[currentMonth].substring(0, 3)} ${currentYear}`;
                      const isPaid = (selectedChitfund?.chitfund_transactions || []).some(t => t.month_name === monthNames[currentMonth] && String(t.year) === String(currentYear) && t.payment_status === 'PAID');
                      options.push({ value, label, isPaid });
                      
                      currentMonth++;
                      if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                      }
                    }

                    return (
                      <select
                        value={addPaymentForm.payment_month || ''}
                        onChange={e => {
                          setAddPaymentForm({...addPaymentForm, payment_month: e.target.value});
                          setPaymentError('');
                        }}
                        required
                        style={{ flex: 1, padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: 'white', color: '#1f2937', fontSize: '16px', outline: 'none', pointerEvents: 'auto' }}
                      >
                        <option value="" disabled>Select Month & Year</option>
                        {options.map(opt => (
                          <option key={opt.value} value={opt.value} disabled={opt.isPaid} style={{ color: opt.isPaid ? '#9ca3af' : '#1f2937' }}>
                            {opt.label}{opt.isPaid ? ' ✓ Paid' : ''}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>Fixed Amount (₹)</label>
                <input type="number" value={addPaymentForm.amount} readOnly style={{ width: '100%', padding: '14px', border: `2px solid ${softPink}`, borderRadius: '12px', background: '#f3f4f6', color: '#6b7280', fontSize: '18px', outline: 'none', pointerEvents: 'auto', cursor: 'not-allowed', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowAddPaymentModal(false); setPaymentError(''); }} style={{ flex: 1, padding: '14px', background: 'white', color: '#4b5563', fontWeight: '600', border: `2px solid ${softPink}`, borderRadius: '9999px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '700', cursor: 'pointer' }}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, pointerEvents: 'auto' }} onClick={() => setShowAddUserModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '460px', padding: '32px', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>Register New Participant</h2>
            <form onSubmit={handleRegisterParticipant} style={{ pointerEvents: 'auto' }}>
              <input type="text" placeholder="Full Name" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} style={{background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'16px', border:`2px solid ${softPink}`, borderRadius:'12px', pointerEvents: 'auto'}} required />
              <input type="tel" placeholder="Phone Number" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} style={{ background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'16px', border:`2px solid ${softPink}`, borderRadius:'12px', pointerEvents: 'auto'}} required />
              <input type="email" placeholder="Email Address" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} style={{ background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'16px', border:`2px solid ${softPink}`, borderRadius:'12px', pointerEvents: 'auto'}} required />
              <input type="text" placeholder="Address" value={newUserForm.address} onChange={e => setNewUserForm({...newUserForm, address: e.target.value})} style={{background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'16px', border:`2px solid ${softPink}`, borderRadius:'12px', pointerEvents: 'auto'}} required />
              <input type="password" placeholder="Password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} style={{background: 'white', color: '#1f2937', width:'100%', padding:'14px', marginBottom:'24px', border:`2px solid ${softPink}`, borderRadius:'12px', pointerEvents: 'auto'}} required />
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
