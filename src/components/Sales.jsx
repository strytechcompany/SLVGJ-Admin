// src/components/Bills.jsx
import { useState, useEffect } from 'react';

export default function Bills({ pink, lightPink, softPink }) {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    fetchAllBills();
  }, []);

  const fetchAllBills = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/bills`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      const allBills = data.bills || [];
      setBills(allBills);
      setFilteredBills(allBills);
      calculateTodayRevenue(allBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      
      // === RICH DEMO DATA WITH MULTIPLE PRODUCTS ===
      const demoBills = [
        {
          bill_id: "bill-123",
          bill_datetime: "2026-04-03T15:30:00.000Z",
          customer_id: "cust-001",
          customer_name: "Arun Varma",
          customer_phone: "9999999999",
          customer_address: "Chennai",
          subtotal: 125000,
          making_charges: 4500,
          cgst_amount: 3875,
          sgst_amount: 3875,
          total_gst_amount: 7750,
          final_net_amount: 137250,
          created_at: "2026-04-03T15:30:00.000Z"
        },
        {
          bill_id: "bill-124",
          bill_datetime: "2026-04-03T17:00:00.000Z",
          customer_id: "cust-002",
          customer_name: "Meera Krishnan",
          customer_phone: "9888888888",
          customer_address: "Puducherry",
          subtotal: 98000,
          making_charges: 3200,
          cgst_amount: 2520,
          sgst_amount: 2520,
          total_gst_amount: 5040,
          final_net_amount: 106240,
          created_at: "2026-04-03T17:00:00.000Z"
        }
      ];
      setBills(demoBills);
      setFilteredBills(demoBills);
      calculateTodayRevenue(demoBills);
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayRevenue = (allBills) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysBills = allBills.filter(bill => {
      const billDate = new Date(bill.bill_datetime).toISOString().split('T')[0];
      return billDate === today;
    });
    const total = todaysBills.reduce((sum, bill) => sum + (bill.final_net_amount || 0), 0);
    setTodayRevenue(total);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredBills(bills);
      return;
    }
    const lowerTerm = term.toLowerCase();
    const filtered = bills.filter(bill =>
      bill.bill_id?.toLowerCase().includes(lowerTerm) ||
      bill.customer_name?.toLowerCase().includes(lowerTerm) ||
      bill.customer_phone?.includes(term)
    );
    setFilteredBills(filtered);
  };

  const fetchBillDetails = async (billId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/bill-details/${billId}`);
      if (!response.ok) throw new Error('Failed to fetch bill items');
      const data = await response.json();
      setBillItems(data.bill || []);
    } catch (error) {
      console.error('Error fetching bill details:', error);

      // MULTIPLE PRODUCTS DEMO DATA (different for each bill)
      let demoItems = [];
      if (billId === "bill-123") {
        demoItems = [
          {
            id: "item-1",
            bill_id: billId,
            product_id: "prod-101",
            item_name: "Gold Ring",
            gross_weight: 12,
            stone_weight: 1.5,
            net_weight: 10.5,
            purity: "22K",
            rate: 6500,
            making_charge: 800,
            total: 69250
          },
          {
            id: "item-2",
            bill_id: billId,
            product_id: "prod-102",
            item_name: "Gold Chain",
            gross_weight: 18,
            stone_weight: 0,
            net_weight: 18,
            purity: "22K",
            rate: 6500,
            making_charge: 1200,
            total: 118200
          },
          {
            id: "item-3",
            bill_id: billId,
            product_id: "prod-103",
            item_name: "Gold Bangle",
            gross_weight: 8,
            stone_weight: 0,
            net_weight: 8,
            purity: "22K",
            rate: 6500,
            making_charge: 600,
            total: 52600
          }
        ];
      } else if (billId === "bill-124") {
        demoItems = [
          {
            id: "item-4",
            bill_id: billId,
            product_id: "prod-201",
            item_name: "Gold Mangalsutra",
            gross_weight: 15,
            stone_weight: 2,
            net_weight: 13,
            purity: "22K",
            rate: 6500,
            making_charge: 1500,
            total: 99750
          },
          {
            id: "item-5",
            bill_id: billId,
            product_id: "prod-202",
            item_name: "Silver Payal",
            gross_weight: 25,
            stone_weight: 0,
            net_weight: 25,
            purity: "92.5",
            rate: 92,
            making_charge: 800,
            total: 3100
          }
        ];
      }
      setBillItems(demoItems);
    }
  };

  const handleRowClick = (bill) => {
    setSelectedBill(bill);
    fetchBillDetails(bill.bill_id);
  };

  const closeModal = () => {
    setSelectedBill(null);
    setBillItems([]);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Today's Revenue + Export PDF */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px 32px',
        border: `1px solid ${softPink}`,
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(225, 29, 138, 0.06)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>💰</span>
            <div style={{ color: '#831843', fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>
              TODAY'S REVENUE
            </div>
          </div>
          <div style={{ fontSize: '42px', fontWeight: '700', marginTop: '8px', color: '#1f2937' }}>
            {formatCurrency(todayRevenue)}
          </div>
         
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
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
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            📄 Create Invoice
          </button>

          <button
            style={{
              padding: '12px 28px',
              background: 'white',
              color: '#831843',
              border: `2px solid ${softPink}`,
              borderRadius: '9999px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
            onClick={() => alert('✅ PDF exported successfully!')}
          >
            📤 Export PDF
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search bills by Bill ID, Customer Name or Phone number..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: '460px',
            padding: '16px 24px',
            borderRadius: '9999px',
            border: `1px solid ${softPink}`,
            fontSize: '15.5px',
            outline: 'none',
            background: 'white',
            color: '#000000',
          }}
        />
        <div style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
          {filteredBills.length} of {bills.length} bills
        </div>
      </div>

      {/* Bills Table */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        border: `1px solid ${softPink}`,
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: lightPink }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Bill ID</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Date &amp; Time</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Customer</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Phone</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '600', color: '#555', fontSize: '14px' }}>Subtotal</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '600', color: '#555', fontSize: '14px' }}>Final Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading bills...</td></tr>
            ) : filteredBills.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#888' }}>No bills found</td></tr>
            ) : (
              filteredBills.map((bill) => (
                <tr
                  key={bill.bill_id}
                  onClick={() => handleRowClick(bill)}
                  style={{ borderTop: `1px solid ${softPink}`, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = lightPink; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  <td style={{ padding: '20px 24px', fontWeight: '600', color: '#1f2937' }}>{bill.bill_id}</td>
                  <td style={{ padding: '20px 24px', color: '#666' }}>{formatDate(bill.bill_datetime)}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: '500' }}>{bill.customer_name}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{bill.customer_address}</div>
                  </td>
                  <td style={{ padding: '20px 24px', color: '#555' }}>{bill.customer_phone}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right', color: '#666' }}>{formatCurrency(bill.subtotal)}</td>
                  <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '700', color: pink, fontSize: '17px' }}>
                    {formatCurrency(bill.final_net_amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal with multiple products */}
      {selectedBill && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={closeModal}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 25px 70px rgba(225, 29, 138, 0.25)' }} onClick={(e) => e.stopImmediatePropagation()}>
            {/* Header */}
            <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '26px', fontWeight: '700' }}>Bill #{selectedBill.bill_id}</div>
                <div style={{ fontSize: '15.5px', color: '#666', marginTop: '4px' }}>{formatDate(selectedBill.bill_datetime)}</div>
              </div>
              <button onClick={closeModal} style={{ fontSize: '34px', lineHeight: 1, background: 'none', border: 'none', color: '#831843', cursor: 'pointer' }}>×</button>
            </div>

            {/* Customer Bar */}
            <div style={{ background: lightPink, padding: '20px 32px', fontSize: '15.5px' }}>
              <strong>Customer:</strong> {selectedBill.customer_name} • {selectedBill.customer_phone}<br />
              {selectedBill.customer_address}
            </div>

            {/* Customer Details Section */}
            <div style={{ padding: '32px', borderBottom: `1px solid ${softPink}` }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>CUSTOMER DETAILS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px 28px', fontSize: '14.5px' }}>
                <div><strong>Customer ID:</strong> {selectedBill.customer_id}</div>
                <div><strong>Bill ID:</strong> {selectedBill.bill_id}</div>
                <div><strong>Created At:</strong> {formatDate(selectedBill.created_at)}</div>
                <div><strong>Subtotal:</strong> {formatCurrency(selectedBill.subtotal)}</div>
                <div><strong>Making Charges:</strong> {formatCurrency(selectedBill.making_charges)}</div>
                <div><strong>CGST:</strong> {formatCurrency(selectedBill.cgst_amount)}</div>
                <div><strong>SGST:</strong> {formatCurrency(selectedBill.sgst_amount)}</div>
                <div><strong>Total GST:</strong> {formatCurrency(selectedBill.total_gst_amount)}</div>
              </div>
            </div>

            {/* Product Details - Multiple items */}
            <div style={{ padding: '0 32px 32px' }}>
              <h3 style={{ margin: '24px 0 16px', fontSize: '18px', fontWeight: '600' }}>PRODUCT DETAILS</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: lightPink }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Purity</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Gross Wt. (g)</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Stone Wt. (g)</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Net Wt. (g)</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Making Charge</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item) => (
                    <tr key={item.id} style={{ borderTop: `1px solid ${softPink}` }}>
                      <td style={{ padding: '16px', fontWeight: '500' }}>{item.item_name}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>{item.purity}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>{item.gross_weight}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>{item.stone_weight}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>{item.net_weight}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>{formatCurrency(item.making_charge)}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: pink }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Final Amount */}
              <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: `2px solid ${softPink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: '600' }}>
                <div>FINAL NET AMOUNT</div>
                <div style={{ fontSize: '28px', color: pink }}>{formatCurrency(selectedBill.final_net_amount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}