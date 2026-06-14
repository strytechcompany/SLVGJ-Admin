import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function MonthlyReport({ pink, lightPink, softPink }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [goldRate, setGoldRate] = useState(0);
  const [chitFundUsers, setChitFundUsers] = useState([]);

  // For adjustments
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({ name: '', description: '', grams: 0, amount: 0 });

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    fetchRate();
    fetchReport();
    fetchChitFundUsers();
  }, [month]);

  const fetchRate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/get-rate`);
      const data = await res.json();
      if (data.gold_rate?.rate) setGoldRate(data.gold_rate.rate);
    } catch (e) {}
  };

  const fetchChitFundUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/chitfunds/users`);
      if (!res.ok) return;
      const data = await res.json();
      const users = data.users || [];
      // For each user fetch their chit funds
      const usersWithChits = await Promise.all(users.map(async (user) => {
        try {
          const r2 = await fetch(`${API_BASE}/api/admin/chitfunds/users/${user._id}`);
          const d2 = await r2.json();
          return { ...user, chitfunds: d2.chitfunds || [] };
        } catch { return { ...user, chitfunds: [] }; }
      }));
      setChitFundUsers(usersWithChits.filter(u => u.chitfunds.length > 0));
    } catch (e) {}
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/monthly-report?month=${month}`);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleAddAdjustment = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/admin/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...adjForm, date: new Date().toISOString() })
      });
      setShowAdjModal(false);
      fetchReport();
    } catch (error) {
      console.error(error);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Shri Lakshmi Vinayaka Golden Jewelley", 105, 15, null, null, "center");
    doc.setFontSize(10);
    doc.text(`Monthly Billing Summary - ${month}`, 105, 22, null, null, "center");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 27, null, null, "center");

    let y = 40;

    // Helper for tables
    const addTable = (title, columns, rows) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(title, 14, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [columns],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
        styles: { fontSize: 8 }
      });
      y = doc.lastAutoTable.finalY + 15;
    };

    // 1. Customer Sales
    const salesCols = ["Customer", "Phone", "Date", "Bill No", "Item", "Weight", "Sri Cost", "Sri Bill", "Sri Plus"];
    const salesRows = reportData.sales?.items?.map(item => {
      const bill = reportData.sales?.bills?.find(b => b.bill_id === item.bill_id);
      return [
        bill?.customer_name || 'N/A',
        bill?.customer_phone || 'N/A',
        bill?.bill_datetime?.split('T')[0] || 'N/A',
        item.bill_id.slice(-6),
        item.item_name,
        `${item.net_weight || 0}g`,
        `₹${item.rate || 0}`,
        `${item.total || 0}`,
        `${item.making_charge || 0}g`
      ];
    }) || [];
    addTable("1. CUSTOMER SALES", salesCols, salesRows);

    // 2. Debt Receivable
    const recCols = ["Name", "Phone", "Grams"];
    const recRows = reportData.debt_receivable?.map(d => [d.name, d.phone, `${d.old_balance}g`]) || [];
    const totalRec = reportData.debt_receivable?.reduce((s, d) => s + d.old_balance, 0) || 0;
    recRows.push(["TOTAL", "", `${totalRec}g`]);
    addTable("2. DEBT RECEIVABLE", recCols, recRows);

    // 3. Debt Payable
    const payCols = ["Name", "Phone", "Grams"];
    const payRows = reportData.debt_payable?.map(d => [d.name, d.phone, `${d.advance_balance}g`]) || [];
    const totalPay = reportData.debt_payable?.reduce((s, d) => s + d.advance_balance, 0) || 0;
    payRows.push(["TOTAL", "", `${totalPay}g`]);
    addTable("3. DEBT PAYABLE", payCols, payRows);

    // 4. Expenses
    const expCols = ["Date", "Name", "Amount"];
    const expRows = reportData.expenses?.map(e => [e.date?.split('T')[0], e.description, `₹${e.amount}`]) || [];
    const totalExp = reportData.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
    expRows.push(["TOTAL", "", `₹${totalExp}`]);
    addTable("4. EXPENSES", expCols, expRows);

    // 5. Chit Funds
    const chitCols = ["Date", "Customer", "Amount", "Grams"];
    const chitRows = reportData.chit_funds?.map(c => [c.date?.split('T')[0], c.customer_name, `₹${c.amount}`, `${(c.amount / goldRate).toFixed(3)}g`]) || [];
    addTable("5. CHIT FUNDS", chitCols, chitRows);

    // 6. Others
    const otherCols = ["Date", "Name", "Description", "Grams", "Amount"];
    const otherRows = reportData.adjustments?.map(a => [a.date?.split('T')[0], a.name, a.description, `${a.grams}g`, `₹${a.amount}`]) || [];
    if(otherRows.length > 0) addTable("6. OTHERS", otherCols, otherRows);

    doc.save(`Monthly_Report_${month}.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Metric", "Value"],
      ["Total Stock Weight", `${reportData.stock?.total_grams || 0} g`],
      ["Monthly Sales Bills", `${reportData.sales?.bills?.length || 0}`],
      ["Cash Balance", `₹${reportData.cash_balance}`],
      ["Expenses Total", `₹${reportData.expenses?.reduce((s,e)=>s+e.amount,0) || 0}`]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    // Sales Sheet
    const salesData = reportData.sales?.items?.map(item => {
      const bill = reportData.sales?.bills?.find(b => b.bill_id === item.bill_id);
      return {
        Customer: bill?.customer_name,
        Phone: bill?.customer_phone,
        Date: bill?.bill_datetime?.split('T')[0],
        BillNo: item.bill_id,
        Item: item.item_name,
        Weight: item.net_weight,
        Cost: item.rate,
        Plus: item.making_charge
      };
    }) || [];
    if(salesData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesData), "Sales");

    // Receivables
    if(reportData.debt_receivable?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.debt_receivable), "Debt Receivable");
    
    // Payables
    if(reportData.debt_payable?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.debt_payable), "Debt Payable");

    // Expenses
    if(reportData.expenses?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.expenses), "Expenses");

    // Chit Funds
    if(reportData.chit_funds?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.chit_funds), "Chit Funds");

    XLSX.writeFile(wb, `Monthly_Report_${month}.xlsx`);
  };

  if (loading || !reportData) return <div style={{ padding: '40px' }}>Loading Report Data...</div>;

  const totalExp = reportData.expenses?.reduce((s,e)=>s+e.amount, 0) || 0;
  const totalRec = reportData.debt_receivable?.reduce((s,d)=>s+d.old_balance, 0) || 0;
  const totalPay = reportData.debt_payable?.reduce((s,d)=>s+d.advance_balance, 0) || 0;
  const totalChit = reportData.chit_funds?.reduce((s,c)=>s+c.amount, 0) || 0;
  const chitGrams = goldRate ? (totalChit / goldRate) : 0;
  const adjGrams = reportData.adjustments?.reduce((s,a)=>s+a.grams, 0) || 0;
  const totalStock = reportData.stock?.total_grams || 0;
  const cashConverted = goldRate ? (reportData.cash_balance / goldRate) : 0;

  const totalBusiness = totalStock + cashConverted + totalRec - totalPay - chitGrams + adjGrams;

  const Card = ({ title, value, color = '#333' }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: `1px solid ${softPink}`, flex: 1, minWidth: '200px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#111' }}>Monthly Report</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', border: `2px solid ${softPink}`, background: 'white', color: '#e11d8a', fontWeight: '700', outline: 'none', cursor: 'pointer', fontSize: '15px', colorScheme: 'light' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAdjModal(true)} style={{ padding: '10px 16px', background: 'white', color: pink, border: `1px solid ${pink}`, borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>+ Add Adjustment</button>
          <button onClick={exportExcel} style={{ padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📄 Excel</button>
          <button onClick={exportPDF} style={{ padding: '10px 16px', background: pink, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📑 PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <Card title="Total Stock Weight" value={`${totalStock.toFixed(3)} g`} />
        <Card title="Monthly Sales Bills" value={reportData.sales?.bills?.length || 0} />
        {/* <Card title="Cash Balance" value={`₹${reportData.cash_balance.toLocaleString()}`} /> */}
        <Card title="Expenses Total" value={`₹${totalExp.toLocaleString()}`} color="#ef4444" />
      </div>

      <style>{`
        .report-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .report-table th { background: #fdf2f8; color: #e11d8a; padding: 12px 16px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #fce7f3; }
        .report-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; }
        .report-table tr:last-child td { border-bottom: none; }
        .report-table .total-row td { background: #fdf2f8; font-weight: bold; color: #e11d8a; border-top: 2px solid #fce7f3; }
      `}</style>

      {/* 1. Customer Sales */}
      <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>1. CUSTOMER SALES</h3>
      <table className="report-table">
        <thead>
          <tr><th>Customer</th><th>Phone</th><th>Date</th><th>Bill No</th><th>Item</th><th>Weight</th><th>SLVGJ Cost</th><th>SLVGJ Bill</th><th>SLVGJ Plus</th></tr>
        </thead>
        <tbody>
          {reportData.sales?.items?.length > 0 ? reportData.sales.items.map((item, i) => {
            const bill = reportData.sales.bills.find(b => b.bill_id === item.bill_id);
            return (
              <tr key={i}>
                <td>{bill?.customer_name || 'N/A'}</td>
                <td>{bill?.customer_phone || 'N/A'}</td>
                <td>{bill?.bill_datetime?.split('T')[0] || 'N/A'}</td>
                <td>{item.bill_id.slice(-6)}</td>
                <td>{item.item_name}</td>
                <td>{item.net_weight || 0}g</td>
                <td>₹{item.rate || 0}</td>
                <td>{item.total || 0}</td>
                <td>{item.making_charge || 0}g</td>
              </tr>
            );
          }) : <tr><td colSpan="9" style={{ textAlign: 'center', color: '#999' }}>No sales this month</td></tr>}
        </tbody>
      </table>

      {/* 2. Debt Receivable */}
      <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>2. DEBT RECEIVABLE</h3>
      <table className="report-table">
        <thead>
          <tr><th>Name</th><th>Phone</th><th>Grams</th></tr>
        </thead>
        <tbody>
          {reportData.debt_receivable?.map((d, i) => (
            <tr key={i}><td>{d.name}</td><td>{d.phone}</td><td style={{ color: '#16a34a', fontWeight: 'bold' }}>{d.old_balance}g</td></tr>
          ))}
          {reportData.debt_receivable?.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>No debts receivable</td></tr>}
          <tr className="total-row">
            <td colSpan="2" style={{ textAlign: 'right' }}>TOTAL:</td>
            <td>{totalRec}g</td>
          </tr>
        </tbody>
      </table>

      {/* 3. Debt Payable */}
      <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>3. DEBT PAYABLE</h3>
      <table className="report-table">
        <thead>
          <tr><th>Name</th><th>Phone</th><th>Grams</th></tr>
        </thead>
        <tbody>
          {reportData.debt_payable?.map((d, i) => (
            <tr key={i}><td>{d.name}</td><td>{d.phone}</td><td style={{ color: '#ef4444', fontWeight: 'bold' }}>{d.advance_balance}g</td></tr>
          ))}
          {reportData.debt_payable?.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>No debts payable</td></tr>}
          <tr className="total-row">
            <td colSpan="2" style={{ textAlign: 'right' }}>TOTAL:</td>
            <td>{totalPay}g</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Expenses */}
      <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>4. EXPENSES</h3>
      <table className="report-table">
        <thead>
          <tr><th>Date</th><th>Name</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {reportData.expenses?.map((e, i) => {
            const dateStr = e.date ? new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return (
              <tr key={i}><td>{dateStr}</td><td>{e.description}</td><td style={{ color: '#ef4444' }}>₹{e.amount}</td></tr>
            );
          })}
          {reportData.expenses?.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>No expenses this month</td></tr>}
          <tr className="total-row">
            <td colSpan="2" style={{ textAlign: 'right' }}>TOTAL:</td>
            <td>₹{totalExp}</td>
          </tr>
        </tbody>
      </table>

      {/* 5. Chit Funds */}
      <h3 style={{ color: '#333', marginBottom: '12px', fontSize: '16px' }}>5. CHIT FUNDS</h3>
      <table className="report-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Chit Plan</th>
            <th>Type</th>
            <th>Duration</th>
            <th style={{ color: '#e11d8a' }}>Months Paid</th>
            <th>Amount/Month</th>
            <th style={{ color: '#16a34a' }}>Cum. Grams</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {chitFundUsers.length === 0 ? (
            <tr><td colSpan="9" style={{ textAlign: 'center', color: '#999' }}>No chit fund data available</td></tr>
          ) : (
            chitFundUsers.flatMap(user =>
              user.chitfunds.map((chit, ci) => {
                const txns = chit.chitfund_transactions || [];
                let cumGrams = 0;
                if (txns.length > 0) {
                  const lastTxn = txns[txns.length - 1];
                  if (lastTxn.cumulative_grams > 0) {
                    cumGrams = lastTxn.cumulative_grams;
                  } else if (goldRate > 0) {
                    cumGrams = txns.reduce((s, t) => s + (t.amount || 0), 0) / goldRate;
                  }
                }
                return (
                  <tr key={`${user._id}-${ci}`}>
                    <td style={{ fontWeight: '600' }}>{user.name}</td>
                    <td>{user.phone}</td>
                    <td style={{ fontWeight: '600' }}>{chit.chitfund_name}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', background: chit.chitfund_type === 'GOLD' ? '#fef3c7' : '#f1f5f9', color: chit.chitfund_type === 'GOLD' ? '#92400e' : '#475569' }}>
                        {chit.chitfund_type}
                      </span>
                    </td>
                    <td>{chit.chitfund_duration} Months</td>
                    <td style={{ color: '#e11d8a', fontWeight: 'bold', textAlign: 'center' }}>{chit.months_paid || txns.length}</td>
                    <td style={{ color: '#16a34a' }}>₹{chit.chitfund_amount}</td>
                    <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{cumGrams.toFixed(3)}g</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', background: chit.is_completed ? '#dcfce7' : '#fef9c3', color: chit.is_completed ? '#166534' : '#854d0e' }}>
                        {chit.is_completed ? 'COMPLETED' : 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )
          )}
          <tr className="total-row">
            <td colSpan="7" style={{ textAlign: 'right' }}>TOTAL Cum. Grams:</td>
            <td colSpan="2">
              {chitFundUsers.flatMap(u => u.chitfunds).reduce((sum, chit) => {
                const txns = chit.chitfund_transactions || [];
                if (txns.length > 0 && txns[txns.length-1].cumulative_grams > 0) return sum + txns[txns.length-1].cumulative_grams;
                if (goldRate > 0) return sum + txns.reduce((s, t) => s + (t.amount || 0), 0) / goldRate;
                return sum;
              }, 0).toFixed(3)}g
            </td>
          </tr>
        </tbody>
      </table>

      {/* 6. Others */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ color: '#333', margin: 0, fontSize: '16px' }}>6. OTHERS (Adjustments)</h3>
        <button onClick={() => setShowAdjModal(true)} style={{ padding: '6px 12px', background: 'white', color: pink, border: `1px solid ${pink}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>+ Add Row</button>
      </div>
      <table className="report-table">
        <thead>
          <tr><th>Date</th><th>Name</th><th>Description</th><th>Grams</th><th>Amount</th><th>Action</th></tr>
        </thead>
        <tbody>
          {reportData.adjustments?.map((a, i) => (
            <tr key={i}>
              <td>{a.date?.split('T')[0]}</td><td>{a.name}</td><td>{a.description}</td>
              <td style={{ color: a.grams >= 0 ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>{a.grams}g</td>
              <td>₹{a.amount}</td>
              <td>
                <button onClick={async () => {
                  if(!window.confirm('Delete adjustment?')) return;
                  await fetch(`${API_BASE}/api/admin/adjustments/${a.id}`, { method: 'DELETE' });
                  fetchReport();
                }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
              </td>
            </tr>
          ))}
          {reportData.adjustments?.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No adjustments added</td></tr>}
        </tbody>
      </table>

      {/* Business Calculation Summary */}
      <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${softPink}`, overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ padding: '16px 24px', background: lightPink, borderBottom: `1px solid ${softPink}`, fontWeight: '700', fontSize: '16px' }}>8. BUSINESS CALCULATION SUMMARY</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>Adjusted Stock (+)</td><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{totalStock.toFixed(3)}g</td></tr>
            <tr><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>Cash Converted (+)</td><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{cashConverted.toFixed(3)}g</td></tr>
            <tr><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>Debt Receivable (+)</td><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{totalRec.toFixed(3)}g</td></tr>
            <tr><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>Debt Payable (-)</td><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>{totalPay.toFixed(3)}g</td></tr>
            <tr><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>Chit Collection (-)</td><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>{chitGrams.toFixed(3)}g</td></tr>
            <tr><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>Other Adjustments</td><td style={{ padding: '12px 24px', borderBottom: '1px solid #eee', textAlign: 'right', color: adjGrams >= 0 ? '#16a34a' : '#ef4444', fontWeight: '600' }}>{adjGrams.toFixed(3)}g</td></tr>
            <tr style={{ background: '#d97706', color: 'white' }}><td style={{ padding: '16px 24px', fontWeight: '800' }}>TOTAL BUSINESS HOLDING</td><td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '800' }}>{totalBusiness.toFixed(3)}g</td></tr>
          </tbody>
        </table>
      </div>

      {showAdjModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Add Adjustment</h2>
            <input placeholder="Name (e.g. Lithika)" value={adjForm.name} onChange={e=>setAdjForm({...adjForm, name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input placeholder="Description (e.g. Eratu)" value={adjForm.description} onChange={e=>setAdjForm({...adjForm, description: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="number" placeholder="Grams (+ or -)" value={adjForm.grams} onChange={e=>setAdjForm({...adjForm, grams: Number(e.target.value)})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="number" placeholder="Amount (₹)" value={adjForm.amount} onChange={e=>setAdjForm({...adjForm, amount: Number(e.target.value)})} style={{ width: '100%', padding: '12px', marginBottom: '24px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={()=>setShowAdjModal(false)} style={{ padding: '10px 16px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddAdjustment} style={{ padding: '10px 16px', background: pink, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
