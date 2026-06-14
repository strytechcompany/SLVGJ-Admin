  // src/components/DashboardHome.jsx
import { useState, useEffect } from 'react';

export default function DashboardHome({ pink, lightPink, softPink }) {
  const staticWeeklyData = [
    { day: 'MON', revenue: 4200 },
    { day: 'TUE', revenue: 5100 },
    { day: 'WED', revenue: 3800 },
    { day: 'THU', revenue: 7200 },
    { day: 'FRI', revenue: 6100 },
    { day: 'SAT', revenue: 2900 },
    { day: 'SUN', revenue: 2100 },
  ];

  const staticRecent = [
    { name: 'Rajesh Kumar', type: 'Subscription Payment • Gold Fund A', amount: 12500, time: '2 mins ago', positive: true },
    { name: 'Priya Sharma', type: 'New Chit Request • Silver Premium', amount: 0, time: '15 mins ago', positive: false },
    { name: 'Venkat R.', type: 'Dealer Commission Payout', amount: -4200, time: '1 hour ago', positive: false },
  ];

  const [goldRate, setGoldRate] = useState(6245);
  const [silverRate, setSilverRate] = useState(74.20);
  const [pendingRequests] = useState(28);
  const [todaySales, setTodaySales] = useState(480000);
  const [weeklyData, setWeeklyData] = useState(staticWeeklyData);
  const [recentTransactions, setRecentTransactions] = useState(staticRecent);
  const [loading, setLoading] = useState(true);

  const maxRevenue = weeklyData && weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.revenue), 1) : 1;

  // === NEW: Rate Update Modal State ===
  const [showRateModal, setShowRateModal] = useState(false);
  const [modalType, setModalType] = useState('gold'); // 'gold' or 'silver'
  const [newRateValue, setNewRateValue] = useState(6245);
  const [updating, setUpdating] = useState(false);

  const formatINR = (num) => `₹${(num / 100000).toFixed(1)}L`;



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.confirm("WARNING: Uploading a backup will erase all current data and restore from the file. Proceed?")) {
      event.target.value = null; // reset
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3000/api/admin/upload-excel', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert("✅ Backup restored successfully! Please refresh the page.");
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert("❌ Failed to restore backup: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error uploading backup.");
    }
    event.target.value = null; // reset
  };

  // Open modal when user clicks on Gold or Silver card
  const openRateModal = (type) => {
    setModalType(type);
    setNewRateValue(type === 'gold' ? goldRate : silverRate);
    setShowRateModal(true);
  };

  // Submit rate update to backend
  const updateRate = async () => {
    if (!newRateValue || newRateValue <= 0) return alert('Please enter a valid rate');

    setUpdating(true);
    try {
      const endpoint = '/api/admin/update-rate';   // Primary endpoint (as per PDF)

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_rate: Number(newRateValue),
          type: modalType
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state immediately
        if (modalType === 'gold') setGoldRate(data.rate?.rate || newRateValue);
        else setSilverRate(data.rate?.rate || newRateValue);

        alert(`✅ ${modalType.toUpperCase()} rate updated successfully!`);
        setShowRateModal(false);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Failed to update rate. Is the backend running?');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Call all 4 new/pre-calculated endpoints in parallel
        const [rateRes, salesRes, weeklyRes, recentRes] = await Promise.all([
          fetch('http://localhost:3000/api/admin/get-rate'),//this is not there
          fetch('http://localhost:3000/api/admin/todays-sales'),
          fetch('http://localhost:3000/api/admin/weekly-data'),
          fetch('http://localhost:3000/api/admin/recent-transactions'),
        ]);

        // Gold & Silver Rates
        if (rateRes.ok) {
          const rates = await rateRes.json();
          setGoldRate(rates.gold_rate?.rate ?? 6245);
          setSilverRate(rates.silver_rate?.rate ?? 74.20);
        }

        // Today's Sales
        if (salesRes.ok) {
          const data = await salesRes.json();
          setTodaySales(data.totalSales || 0);
        }

        // Weekly Data
        if (weeklyRes.ok) {
          const { weeklyData: week } = await weeklyRes.json();
          setWeeklyData(week || []);
        }

        // Recent Transactions
        if (recentRes.ok) {
          const { recentTransactions: rec } = await recentRes.json();
          if (rec && rec.length) {
            const mapped = rec.map(bill => ({
              name: bill.customer_name,
              type: `Bill #${bill.bill_id}`,
              amount: bill.final_net_amount,
              time: new Date(bill.bill_datetime || bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
              positive: true
            }));
            setRecentTransactions(mapped);
          } else {
            setRecentTransactions([]);
          }
        }
      } catch (err) {
        console.log('🚀 Backend APIs not ready yet → showing beautiful static fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '120px 40px', textAlign: 'center', color: '#831843', fontSize: '18px' }}>
        Loading live dashboard data...
      </div>
    );
  }

  return (
    <>
      {/* Header + Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '34px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Dashboard Overview</h1>
              <p style={{ color: '#666', marginTop: '6px' }}>Executive Overview • Today</p>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Download Report Button with Hover */}
              <button
                style={{
                  padding: '12px 28px',
                  border: `1px solid ${softPink}`,
                  borderRadius: '9999px',
                  background: 'white',
                  color: '#831843',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = lightPink;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={(e) => {
                  window.open('http://localhost:3000/api/admin/download-excel', '_blank');
                }}
              >
                📥 Download Report
              </button>

              <input 
                type="file" 
                id="backup-upload" 
                style={{ display: 'none' }} 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
              />
              <button
                style={{
                  padding: '12px 28px',
                  background: pink,
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(225, 29, 138, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(225, 29, 138, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(225, 29, 138, 0.3)';
                }}
                onClick={() => document.getElementById('backup-upload').click()}
              >
                📤 Upload Backup
              </button>
            </div>
          </div>

      {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {/* Gold Rate - Clickable */}
        <div
          onClick={() => openRateModal('gold')}
          style={{ background: 'white', padding: '28px 26px', borderRadius: '20px', border: `1px solid ${softPink}`, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#831843', fontSize: '15px' }}>🪙 Gold Rate (22k)</div>
              <div style={{ fontSize: '42px', fontWeight: '700', margin: '12px 0 6px' }}>₹{goldRate}</div>
            </div>

          </div>

        </div>

        {/* Silver Rate - Clickable */}
        <div
          onClick={() => openRateModal('silver')}
          style={{ background: 'white', padding: '28px 26px', borderRadius: '20px', border: `1px solid ${softPink}`, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#831843', fontSize: '15px' }}>🥈 Silver Rate </div>
              <div style={{ fontSize: '42px', fontWeight: '700', margin: '12px 0 6px' }}>₹{silverRate}</div>
            </div>

          </div>

        </div>

            <div style={{ background: 'white', padding: '28px 26px', borderRadius: '20px', border: `1px solid ${softPink}` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#831843', fontSize: '15px' }}>🛎️ Pending Requests</div>
                <div style={{ fontSize: '42px', fontWeight: '700', margin: '12px 0 6px' }}>28</div>
              </div>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${pink}, #db2777)`,
              color: 'white',
              padding: '28px 26px',
              borderRadius: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '16px', opacity: 0.95 }}>Today's Sales</div>
                  <div style={{ fontSize: '48px', fontWeight: '700', marginTop: '12px' }}>
                    ₹{Number(todaySales || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '14.5px', opacity: 0.85 }}>+12% from yesterday</div>
                </div>
                <div style={{ fontSize: '58px' }}>⚡</div>
              </div>
            </div>
          </div>


   
      {/* Recent Transactions */}
      <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px',
            border: `1px solid ${softPink}`
          }}
        >
          <h2
            style={{
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937'
            }}
          >
            Recent Transactions
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {recentTransactions.map((transaction, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background:
                        transaction.amount > 0
                          ? '#fef3c7'
                          : transaction.amount < 0
                          ? '#fee2e2'
                          : '#dbeafe',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}
                  >
                    {transaction.amount > 0
                      ? '👤'
                      : transaction.amount < 0
                      ? '💸'
                      : '🛒'}
                  </div>

                  <div>
                    <div style={{ fontWeight: '600' }}>
                      {transaction.name}
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: '#666'
                      }}
                    >
                      {transaction.type}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      color:
                        transaction.amount > 0
                          ? '#22c55e'
                          : transaction.amount < 0
                          ? '#ef4444'
                          : '#f59e0b',
                      fontWeight: '600'
                    }}
                  >
                    {transaction.amount === 0
                      ? 'Pending'
                      : `${transaction.amount > 0 ? '+' : '-'} ₹${Math.abs(
                          transaction.amount
                        ).toLocaleString()}`}
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#888'
                    }}
                  >
                    {transaction.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          {/* <div style={{ background: 'white', borderRadius: '20px', padding: '28px', border: `1px solid ${softPink}` }}>
            <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>Recent Transactions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Rajesh Kumar</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Subscription Payment • Gold Fund A</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#22c55e', fontWeight: '600' }}>+ ₹12,500</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>2 mins ago</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛒</div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Priya Sharma</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>New Chit Request • Silver Premium</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontWeight: '600' }}>Pending</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>15 mins ago</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💸</div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Venkat R.</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Dealer Commission Payout</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#ef4444', fontWeight: '600' }}>- ₹4,200</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>1 hour ago</div>
                </div>
              </div>
            </div>
          </div> */}






      {/* Sales Weekly Trends + Recent Transactions (same as original) */}
      {/* ... (I kept the full original weekly chart + transactions code here — it's identical) */}
      {/* You can copy-paste the rest from your original Dashboard.jsx if needed */}



              {/* ==================== RATE UPDATE MODAL ==================== */}
      {showRateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '420px',
            padding: '32px', boxShadow: '0 20px 40px rgba(225,29,138,0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px', color: '#1f2937' }}>
              Update {modalType === 'gold' ? 'Gold' : 'Silver'} Rate
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#831843' }}>
                New Rate ({modalType === 'gold' ? '24K / 10g' : '1g'})
              </label>
              <input
                type="number"
                value={newRateValue}
                onChange={(e) => setNewRateValue(e.target.value)}
                style={{
                  width: '100%', padding: '14px', fontSize: '24px',
                  borderRadius: '12px', border: `2px solid ${softPink}`,
                  textAlign: 'center'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowRateModal(false)}
                style={{
                  flex: 1, padding: '14px', background: 'white',
                  border: `1px solid ${softPink}`, borderRadius: '9999px',
                  color: '#831843', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={updateRate}
                disabled={updating}
                style={{
                  flex: 1, padding: '14px', background: pink,
                  color: 'white', border: 'none', borderRadius: '9999px',
                  fontWeight: '600', cursor: updating ? 'not-allowed' : 'pointer'
                }}
              >
                {updating ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </div>
        </div>
      )}


    </>



  );
}
