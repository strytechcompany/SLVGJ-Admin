// src/components/Expenses.jsx
import { useState, useEffect } from 'react';

export default function Expenses({ pink, lightPink, softPink }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Add expense modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    amount: '',
    description: ''
  });

  const API_BASE = 'http://localhost:3000';

  // Demo data (rich & realistic for gold/jewellery business)
  const demoExpensesData = [
    {
      id: "EXP-001",
      amount: 28500,
      description: "Shop rent - April 2026 (Puducherry branch)",
      date: "2026-04-01"
    },
    {
      id: "EXP-002",
      amount: 12400,
      description: "Gold polishing machine maintenance",
      date: "2026-04-03"
    },
    {
      id: "EXP-003",
      amount: 6500,
      description: "Internet + electricity bill",
      date: "2026-04-05"
    },
    {
      id: "EXP-004",
      amount: 18750,
      description: "Packaging materials & jewellery boxes (bulk order)",
      date: "2026-04-08"
    },
    {
      id: "EXP-005",
      amount: 3200,
      description: "Marketing - Instagram ads for new chit fund launch",
      date: "2026-04-10"
    },
    {
      id: "EXP-006",
      amount: 9800,
      description: "Staff salary advance - 2 employees",
      date: "2026-04-12"
    }
  ];

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  const fetchAllExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/expenses`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      const allExpenses = data.expenses || data || [];
      setExpenses(allExpenses);
      setFilteredExpenses(allExpenses);
      calculateTotal(allExpenses);
    } catch {
      // Demo fallback
      setExpenses(demoExpensesData);
      setFilteredExpenses(demoExpensesData);
      calculateTotal(demoExpensesData);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (expList) => {
    const total = expList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    setTotalExpenses(total);
  };

  // ====================== ENHANCED SEARCH ======================
  const handleSearch = (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setFilteredExpenses(expenses);
      return;
    }

    const lower = term.toLowerCase().trim();

    const filtered = expenses.filter((exp) => {
      const idMatch = exp.id?.toLowerCase().includes(lower) || false;
      const descMatch = exp.description?.toLowerCase().includes(lower) || false;

      let dateMatch = false;
      if (exp.date) {
        // 1. Raw date (YYYY-MM-DD)
        dateMatch = exp.date.toLowerCase().includes(lower);
        // 2. Formatted date (e.g. "1 Apr 2026", "Apr 2026", "2026")
        if (!dateMatch) {
          dateMatch = formatDate(exp.date).toLowerCase().includes(lower);
        }
      }

      return idMatch || descMatch || dateMatch;
    });

    setFilteredExpenses(filtered);
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newExpenseForm.amount || !newExpenseForm.description) return;

    const payload = {
      amount: Number(newExpenseForm.amount),
      description: newExpenseForm.description.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        alert('✅ Expense added successfully!');
        setShowAddModal(false);
        setNewExpenseForm({ amount: '', description: '' });
        fetchAllExpenses(); // refresh list
      } else {
        throw new Error();
      }
    } catch {
      // Demo mode - add locally
      const demoNewExpense = {
        id: `EXP-${String(100 + Math.floor(Math.random() * 900)).padStart(3, '0')}`,
        amount: payload.amount,
        description: payload.description,
        date: new Date().toISOString().split('T')[0]
      };
      const updatedExpenses = [...expenses, demoNewExpense];
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses);
      calculateTotal(updatedExpenses);
      setShowAddModal(false);
      setNewExpenseForm({ amount: '', description: '' });
      alert('✅ Expense added (demo mode)');
    }
  };

  const formatDate = (dateStr) => {
    return dateStr
      ? new Date(dateStr).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : '—';
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: '700', margin: 0, color: '#1f2937' }}>Expenses Tracker</h1>
          <p style={{ color: '#666', marginTop: '6px' }}>Track all business expenses • Real-time overview</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '14px 32px',
            background: pink,
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(225, 29, 138, 0.3)'
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span> Add New Expense
        </button>
      </div>

      {/* Total Expenses Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px 32px',
        border: `1px solid ${softPink}`,
        marginBottom: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '420px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', color: '#831843', fontWeight: '600', letterSpacing: '0.5px' }}>
            TOTAL EXPENSES
          </div>
          <div style={{ fontSize: '42px', fontWeight: '700', color: '#ef4444', marginTop: '4px' }}>
            {formatCurrency(totalExpenses)}
          </div>
          
        </div>
        <div style={{
          background: '#fee2e2',
          color: '#ef4444',
          width: '68px',
          height: '68px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px'
        }}>
          💸
        </div>
      </div>

      {/* Search - UPDATED PLACEHOLDER */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search by Expense ID, Date or description..."
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
            color: '#1f2937',
          }}
        />
        <div style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
          {filteredExpenses.length} of {expenses.length} expenses
        </div>
      </div>

      {/* Expenses Table */}
      <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${softPink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: lightPink }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Expense ID</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Date</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '14px' }}>Description</th>
              <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '600', color: '#555', fontSize: '14px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '80px', textAlign: 'center', color: '#888' }}>
                  Loading expenses...
                </td>
              </tr>
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '80px', textAlign: 'center', color: '#888' }}>
                  No expenses found
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr
                  key={exp.id}
                  style={{
                    borderTop: `1px solid ${softPink}`,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = lightPink)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <td style={{ padding: '20px 24px', fontWeight: '600', color: '#1f2937' }}>{exp.id}</td>
                  <td style={{ padding: '20px 24px', color: '#666' }}>{formatDate(exp.date)}</td>
                  <td style={{ padding: '20px 24px', color: '#333' }}>{exp.description}</td>
                  <td style={{
                    padding: '20px 24px',
                    textAlign: 'right',
                    fontWeight: '700',
                    color: '#ef4444',
                    fontSize: '17px'
                  }}>
                    {formatCurrency(exp.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD EXPENSE MODAL (unchanged) */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              width: '460px',
              padding: '32px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '24px', color: '#1f2937' }}>Add New Expense</h2>
            <form onSubmit={handleAddExpenseSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={newExpenseForm.amount}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `2px solid ${softPink}`,
                    background: 'white',
                    color: '#1f2937',
                    fontSize: '17px'
                  }}
                  placeholder="0"
                  required
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Description
                </label>
                <textarea
                  value={newExpenseForm.description}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `2px solid ${softPink}`,
                    background: 'white',
                    color: '#1f2937',
                    resize: 'vertical'
                  }}
                  placeholder="What was this expense for?"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'white',
                    border: `2px solid ${softPink}`,
                    borderRadius: '9999px',
                    color: '#831843',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: pink,
                    color: 'white',
                    border: 'none',
                    borderRadius: '9999px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}