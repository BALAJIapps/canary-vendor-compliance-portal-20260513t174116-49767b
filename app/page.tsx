'use client';

import { useState, useEffect } from 'react';
import { Building2, FileText, CheckCircle, Bell, BarChart3, Upload, ShieldCheck, Clock, XCircle, AlertTriangle } from 'lucide-react';

type Vendor = {
  id: string;
  vendor_email: string;
  company_name: string;
  category: string;
  risk_level: string;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Notification = {
  id: string;
  vendor_id: string | null;
  type: string;
  message: string;
  status: string;
  created_at: string;
};

type Document = {
  id: string;
  vendor_id: string;
  document_name: string;
  document_url: string;
  document_type: string;
  created_at: string;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-800 border border-amber-200' },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border border-red-200' },
  };
  const s = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-700 border border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
      {status === 'approved' && <CheckCircle size={11} />}
      {status === 'rejected' && <XCircle size={11} />}
      {status === 'pending'  && <Clock size={11} />}
      {s.label}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    low:      'bg-blue-50 text-blue-700 border border-blue-200',
    medium:   'bg-amber-50 text-amber-700 border border-amber-200',
    high:     'bg-red-50 text-red-700 border border-red-200',
    critical: 'bg-red-100 text-red-900 border border-red-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[level] ?? 'bg-gray-100 text-gray-700'}`}>
      {level}
    </span>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'onboard' | 'documents' | 'admin' | 'notifications' | 'dashboard'>('dashboard');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Vendor form
  const [vendorEmail, setVendorEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium');

  // Document form
  const [docVendorId, setDocVendorId] = useState('');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('');

  // Approve form
  const [approveVendorId, setApproveVendorId] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchData = async () => {
    try {
      const [vRes, nRes] = await Promise.all([
        fetch('/api/canary-vendors'),
        fetch('/api/canary-notifications'),
      ]);
      const vData = await vRes.json();
      const nData = await nRes.json();
      if (vData.ok) setVendors(vData.vendors);
      if (nData.ok) setNotifications(nData.notifications);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/canary-vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_email: vendorEmail, company_name: companyName, category, risk_level: riskLevel }),
      });
      const data = await res.json();
      if (data.ok) {
        showMsg(`Vendor "${companyName}" registered successfully`);
        setVendorEmail(''); setCompanyName(''); setCategory(''); setRiskLevel('medium');
        await fetchData();
        setActiveTab('dashboard');
      } else {
        showMsg(data.error?.message ?? 'Registration failed', 'error');
      }
    } catch {
      showMsg('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/canary-vendor-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: docVendorId, document_name: docName, document_url: docUrl, document_type: docType }),
      });
      const data = await res.json();
      if (data.ok) {
        showMsg('Document recorded successfully');
        setDocVendorId(''); setDocName(''); setDocUrl(''); setDocType('');
        await fetchData();
      } else {
        showMsg(data.error?.message ?? 'Upload failed', 'error');
      }
    } catch {
      showMsg('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveVendorId) { showMsg('Select a vendor', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/canary-vendors/${approveVendorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: reviewNote, action: approveAction }),
      });
      const data = await res.json();
      if (data.ok) {
        showMsg(`Vendor ${approveAction === 'approve' ? 'approved' : 'rejected'} successfully`);
        setApproveVendorId(''); setReviewNote('');
        await fetchData();
      } else {
        showMsg(data.error?.message ?? 'Action failed', 'error');
      }
    } catch {
      showMsg('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pendingVendors = vendors.filter(v => v.status === 'pending');
  const approvedVendors = vendors.filter(v => v.status === 'approved');
  const rejectedVendors = vendors.filter(v => v.status === 'rejected');

  const tabs = [
    { key: 'dashboard',      label: 'Dashboard',      icon: BarChart3 },
    { key: 'onboard',        label: 'Register Vendor', icon: Building2 },
    { key: 'documents',      label: 'Documents',       icon: FileText },
    { key: 'admin',          label: 'Admin Approval',  icon: ShieldCheck },
    { key: 'notifications',  label: 'Activity',        icon: Bell },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--vc-surface)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--vc-primary)', borderBottom: '3px solid var(--vc-accent)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck size={28} color="var(--vc-accent)" strokeWidth={1.8} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--vc-on-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>VendorGuard</div>
              <div style={{ fontSize: 11, color: 'var(--vc-header-sub)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Compliance Portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--vc-header-sub)' }}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
            <span style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 13, color: 'var(--vc-on-primary)', background: pendingVendors.length > 0 ? 'var(--vc-accent)' : 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 4, fontWeight: 600 }}>
              {pendingVendors.length} pending
            </span>
          </div>
        </div>
      </header>

      {/* Flash message */}
      {message && (
        <div style={{ backgroundColor: messageType === 'success' ? '#dcfce7' : '#fee2e2', borderBottom: `1px solid ${messageType === 'success' ? '#86efac' : '#fca5a5'}`, padding: '10px 24px', textAlign: 'center', fontSize: 14, color: messageType === 'success' ? '#166534' : '#991b1b', fontWeight: 500 }}>
          {message}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tab nav */}
        <nav style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--vc-border)', paddingBottom: 0 }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
                fontSize: 14, fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? 'var(--vc-primary)' : 'var(--vc-text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === key ? '2px solid var(--vc-accent)' : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.15s',
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
              {key === 'admin' && pendingVendors.length > 0 && (
                <span style={{ background: 'var(--vc-accent)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{pendingVendors.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Compliance Dashboard</h1>
            <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 28 }}>Real-time overview of vendor onboarding and approval status</p>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Vendors', value: vendors.length, icon: Building2, color: 'var(--vc-primary)' },
                { label: 'Pending Review', value: pendingVendors.length, icon: Clock, color: '#d97706' },
                { label: 'Approved', value: approvedVendors.length, icon: CheckCircle, color: '#16a34a' },
                { label: 'Rejected', value: rejectedVendors.length, icon: XCircle, color: '#dc2626' },
                { label: 'Notifications', value: notifications.length, icon: Bell, color: 'var(--vc-accent)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--vc-text-primary)', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 12, color: 'var(--vc-text-muted)', marginTop: 4 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent vendors table */}
            {vendors.length > 0 ? (
              <div style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--vc-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--vc-primary)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Vendor Registry</h2>
                  <span style={{ fontSize: 12, color: 'var(--vc-text-muted)' }}>{vendors.length} total</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--vc-neutral-tint)' }}>
                        {['Company', 'Email', 'Category', 'Risk', 'Status', 'Review Note', 'Registered'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--vc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map((v, i) => (
                        <tr key={v.id} style={{ borderTop: '1px solid var(--vc-border)', backgroundColor: i % 2 === 1 ? 'var(--vc-neutral-tint)' : 'transparent' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--vc-text-primary)' }}>{v.company_name}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-body)' }}>{v.vendor_email}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-body)' }}>{v.category}</td>
                          <td style={{ padding: '12px 16px' }}><RiskBadge level={v.risk_level} /></td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={v.status} /></td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-muted)', fontSize: 12 }}>{v.review_note ?? '—'}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px dashed var(--vc-border)', borderRadius: 8, padding: '48px 24px', textAlign: 'center' }}>
                <Building2 size={40} color="var(--vc-text-faint)" strokeWidth={1.4} style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--vc-text-muted)', fontSize: 14 }}>No vendors registered yet. Use the <strong>Register Vendor</strong> tab to onboard your first vendor.</p>
              </div>
            )}
          </div>
        )}

        {/* ── ONBOARD ── */}
        {activeTab === 'onboard' && (
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Register Vendor</h1>
            <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 28 }}>Submit a new vendor for compliance review and approval</p>
            <form onSubmit={handleRegisterVendor} style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, padding: 28 }}>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="vendor_email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Vendor Email</label>
                <input id="vendor_email" type="email" required value={vendorEmail} onChange={e => setVendorEmail(e.target.value)}
                  placeholder="vendor@company.com"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="company_name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Company Name</label>
                <input id="company_name" type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Acme Supplies Ltd."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="category" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Category</label>
                <input id="category" type="text" required value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Logistics, IT Services, Facilities"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="risk_level" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Risk Level</label>
                <select id="risk_level" value={riskLevel} onChange={e => setRiskLevel(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '11px 24px', backgroundColor: loading ? 'var(--vc-primary-mid)' : 'var(--vc-primary)', color: 'var(--vc-on-primary)', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', letterSpacing: '0.01em' }}>
                {loading ? 'Submitting…' : 'Submit Vendor for Review'}
              </button>
            </form>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div style={{ maxWidth: 600 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Document Upload</h1>
            <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 28 }}>Record compliance documents for a vendor</p>
            <form onSubmit={handleUploadDocument} style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, padding: 28 }}>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="doc_vendor" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Vendor</label>
                <select id="doc_vendor" required value={docVendorId} onChange={e => setDocVendorId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Select vendor…</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_email})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="doc_name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Document Name</label>
                <input id="doc_name" type="text" required value={docName} onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. insurance.pdf"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="doc_url" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Document URL</label>
                <input id="doc_url" type="url" required value={docUrl} onChange={e => setDocUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="doc_type" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Document Type</label>
                <select id="doc_type" required value={docType} onChange={e => setDocType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                  <option value="">Select type…</option>
                  <option value="insurance">Insurance Certificate</option>
                  <option value="tax">Tax Clearance</option>
                  <option value="license">Business License</option>
                  <option value="contract">Contract / Agreement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '11px 24px', backgroundColor: loading ? 'var(--vc-primary-mid)' : 'var(--vc-primary)', color: 'var(--vc-on-primary)', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                {loading ? 'Saving…' : 'Save Document Record'}
              </button>
            </form>
          </div>
        )}

        {/* ── ADMIN APPROVAL ── */}
        {activeTab === 'admin' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Admin Approval Queue</h1>
            <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 28 }}>Review and approve or reject vendor compliance submissions</p>

            {/* Pending vendors table */}
            {vendors.length > 0 ? (
              <div style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--vc-border)', backgroundColor: 'var(--vc-accent-header-bg)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--vc-accent-text)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Vendor Review Queue</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--vc-neutral-tint)' }}>
                        {['Company', 'Email', 'Category', 'Risk', 'Status', 'Docs', 'Updated', 'Note'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--vc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map((v, i) => (
                        <tr key={v.id} style={{ borderTop: '1px solid var(--vc-border)', backgroundColor: i % 2 === 1 ? 'var(--vc-neutral-tint)' : 'transparent' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--vc-text-primary)' }}>{v.company_name}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-body)' }}>{v.vendor_email}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-body)' }}>{v.category}</td>
                          <td style={{ padding: '12px 16px' }}><RiskBadge level={v.risk_level} /></td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={v.status} /></td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-muted)', fontSize: 12 }}>—</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : new Date(v.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-muted)', fontSize: 12 }}>{v.review_note ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Approve / reject form */}
            <div style={{ maxWidth: 500, backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, padding: 28 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 20, textTransform: 'uppercase' }}>Review Decision</h3>
              <form onSubmit={handleApprove}>
                <div style={{ marginBottom: 18 }}>
                  <label htmlFor="approve_vendor" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Select Vendor</label>
                  <select id="approve_vendor" required value={approveVendorId} onChange={e => setApproveVendorId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' }}>
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} — {v.status}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 8 }}>Decision</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {(['approve', 'reject'] as const).map(act => (
                      <label key={act} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--vc-text-body)', padding: '8px 16px', border: `1px solid ${approveAction === act ? (act === 'approve' ? '#16a34a' : '#dc2626') : 'var(--vc-border)'}`, borderRadius: 6, backgroundColor: approveAction === act ? (act === 'approve' ? '#f0fdf4' : '#fef2f2') : '#fff', transition: 'all 0.15s' }}>
                        <input type="radio" name="action" value={act} checked={approveAction === act} onChange={() => setApproveAction(act)} style={{ accentColor: act === 'approve' ? '#16a34a' : '#dc2626' }} />
                        {act === 'approve' ? <><CheckCircle size={15} color="#16a34a" /> Approve</> : <><XCircle size={15} color="#dc2626" /> Reject</>}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="review_note" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 }}>Reviewer Note</label>
                  <textarea id="review_note" value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                    placeholder="Add a compliance note or reason…"
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '11px 24px', backgroundColor: approveAction === 'approve' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}>
                  {loading ? 'Processing…' : approveAction === 'approve' ? 'Approve Vendor' : 'Reject Vendor'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Activity &amp; Notifications</h1>
            <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 28 }}>Audit trail of all compliance events and system notifications</p>
            {notifications.length > 0 ? (
              <div style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--vc-border)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--vc-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Notification History</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--vc-neutral-tint)' }}>
                        {['Type', 'Message', 'Status', 'Time'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--vc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map((n, i) => (
                        <tr key={n.id} style={{ borderTop: '1px solid var(--vc-border)', backgroundColor: i % 2 === 1 ? 'var(--vc-neutral-tint)' : 'transparent' }}>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--vc-primary)', fontWeight: 600, fontFamily: 'monospace', backgroundColor: 'var(--vc-primary-tint)', padding: '2px 8px', borderRadius: 4 }}>{n.type}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-body)' }}>{n.message}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 12, color: n.status === 'sent' ? '#166534' : '#92400e', backgroundColor: n.status === 'sent' ? '#dcfce7' : '#fef3c7', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{n.status}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--vc-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(n.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--vc-surface-card)', border: '1px dashed var(--vc-border)', borderRadius: 8, padding: '48px 24px', textAlign: 'center' }}>
                <Bell size={40} color="var(--vc-text-faint)" strokeWidth={1.4} style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--vc-text-muted)', fontSize: 14 }}>No notifications yet. Register a vendor or complete an approval to generate activity.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
