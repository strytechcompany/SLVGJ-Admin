import React, { useState, useEffect } from 'react';

export default function Stock({ pink, lightPink, softPink }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stock`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (p) => {
    setViewingProduct(p);
    setShowViewModal(true);
  };

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) || p.product_id?.toLowerCase().includes(searchTerm.toLowerCase()));

  const inputStyle = { width: '100%', padding: '12px', border: `2px solid ${softPink}`, borderRadius: '12px', outline: 'none', background: 'white' };

  const inStockProducts = products.filter(p => p.status === 'in_stock');
  const totalItems = inStockProducts.length;
  const totalGrams = inStockProducts.reduce((sum, p) => sum + (Number(p.net_weight) || 0), 0);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', color: '#1f2937', marginBottom: '8px', fontWeight: 'bold' }}>Stock Management</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>View and manage live inventory from Billing DB</p>
        </div>
        <div style={{ display: 'flex', gap: '24px', background: 'white', padding: '16px 24px', borderRadius: '16px', border: `1px solid ${softPink}`, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Items in Stock</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: pink }}>{totalItems}</div>
          </div>
          <div style={{ width: '1px', background: softPink }}></div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Weight</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: pink }}>{totalGrams.toFixed(3)}g</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: `1px solid ${softPink}`, marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }}>🔍</span>
          <input type="text" placeholder="Search by name, barcode or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '16px 24px 16px 48px', borderRadius: '9999px', border: `1px solid ${softPink}`, fontSize: '16px', outline: 'none' }} />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '20px', border: `1px solid ${softPink}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: softPink, color: '#831843', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Product ID</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Barcode</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Weights (Gr/Nt)</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Stock</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Loading stock...</td></tr> : 
             filteredProducts.length === 0 ? <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>No products found</td></tr> :
             filteredProducts.map(p => (
              <tr key={p.product_id} style={{ borderTop: `1px solid ${softPink}` }}>
                <td style={{ padding: '16px 24px', color: '#4b5563', fontSize: '14px' }}>{p.product_id}</td>
                <td style={{ padding: '16px 24px', fontWeight: '500', color: '#1f2937' }}>{p.name}</td>
                <td style={{ padding: '16px 24px', color: '#6b7280' }}>{p.barcode}</td>
                <td style={{ padding: '16px 24px', color: '#4b5563' }}>{p.gross_weight}g / {p.net_weight}g</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', background: p.status === 'in_stock' ? '#dcfce7' : '#fee2e2', color: p.status === 'in_stock' ? '#166534' : '#991b1b' }}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: '#1f2937', fontWeight: '600' }}>{p.stock}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => openViewModal(p)} title="View Details" style={{ padding: '8px', background: lightPink, color: pink, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>👁️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {showViewModal && viewingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937', borderBottom: `2px solid ${softPink}`, paddingBottom: '12px' }}>Product Details</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#4b5563', fontSize: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><span style={{fontWeight: 'bold'}}>Product ID:</span> {viewingProduct.product_id}</div>
                <div><span style={{fontWeight: 'bold'}}>Barcode:</span> {viewingProduct.barcode}</div>
              </div>
              <div><span style={{fontWeight: 'bold'}}>Name:</span> {viewingProduct.name}</div>
              <div><span style={{fontWeight: 'bold'}}>Supplier:</span> {viewingProduct.supplier_name || 'N/A'}</div>
              <div><span style={{fontWeight: 'bold'}}>Purity:</span> {viewingProduct.purity || 'N/A'}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div><span style={{fontWeight: 'bold'}}>Gross Weight:</span> {viewingProduct.gross_weight}g</div>
                <div><span style={{fontWeight: 'bold'}}>Net Weight:</span> {viewingProduct.net_weight}g</div>
                <div><span style={{fontWeight: 'bold'}}>Stone Weight:</span> {viewingProduct.stone_weight}g</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div><span style={{fontWeight: 'bold'}}>Buying Cost:</span> ₹{viewingProduct.buying_cost || 0}</div>
                <div><span style={{fontWeight: 'bold'}}>Bore Rate:</span> ₹{viewingProduct.bore_rate || 0}</div>
                <div><span style={{fontWeight: 'bold'}}>Price/Gram:</span> ₹{viewingProduct.price_per_gram || 0}</div>
                <div><span style={{fontWeight: 'bold'}}>Making Charge:</span> ₹{viewingProduct.making_charge || 0}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><span style={{fontWeight: 'bold'}}>Status:</span> <span style={{ color: viewingProduct.status === 'in_stock' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{viewingProduct.status.toUpperCase()}</span></div>
                <div><span style={{fontWeight: 'bold'}}>Stock:</span> {viewingProduct.stock}</div>
              </div>

              <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <div>Added By: {viewingProduct.added_by || 'Unknown'}</div>
                <div>Created: {new Date(viewingProduct.created_at).toLocaleString()}</div>
                {viewingProduct.sold_at && <div>Sold: {new Date(viewingProduct.sold_at).toLocaleString()}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button type="button" onClick={() => setShowViewModal(false)} style={{ width: '100%', padding: '14px', background: pink, color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
