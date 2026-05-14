'use client';

import { useState, useEffect } from 'react';
import { Building2, FileText, CheckCircle, Bell, BarChart3, ShieldCheck, Clock, XCircle, ArrowRight } from 'lucide-react';

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:  { label: 'Pending',  color: '#92400e', bg: '#fef3c7' },
    approved: { label: 'Approved', color: '#166534', bg: '#dcfce7' },
    rejected: { label: 'Rejected', color: '#991b1b', bg: '#fee2e2' },
  };
  const s = map[status] ?? { label: status, color: '#374151', bg: '#f3f4f6' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: s.color, backgroundColor: s.bg }}>
      {status === 'approved' && <CheckCircle size={11} />}
      {status === 'rejected' && <XCircle size={11} />}
      {status === 'pending'  && <Clock size={11} />}
      {s.label}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    low:      { color: '#1e40af', bg: '#eff6ff' },
    medium:   { color: '#92400e', bg: '#fffbeb' },
    high:     { color: '#991b1b', bg: '#fef2f2' },
    critical: { color: '#7f1d1d', bg: '#fee2e2' },
  };
  const s = map[level] ?? { color: '#374151', bg: '#f3f4f6' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, color: s.color, backgroundColor: s.bg }}>{level}</span>
  );
}

type TabKey = 'dashboard' | 'onboard' | 'documents' | 'admin' | 'notifications';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [vendorEmail, setVendorEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium');

  const [docVendorId, setDocVendorId] = useState('');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('');

  const [approveVendorId, setApproveVendorId] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const fetchData = async () => {
    try {
      const [vRes, nRes] = await Promise.all([fetch('/api/canary-vendors'), fetch('/api/canary-notifications')]);
      const vData = await vRes.json(); const nData = await nRes.json();
      if (vData.ok) setVendors(vData.vendors);
      if (nData.ok) setNotifications(nData.notifications);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/canary-vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_email: vendorEmail, company_name: companyName, category, risk_level: riskLevel }) });
      const data = await res.json();
      if (data.ok) { showMsg(`Vendor "${companyName}" registered successfully`); setVendorEmail(''); setCompanyName(''); setCategory(''); setRiskLevel('medium'); await fetchData(); setActiveTab('dashboard'); }
      else showMsg(data.error?.message ?? 'Registration failed', 'error');
    } catch { showMsg('Network error', 'error'); } finally { setLoading(false); }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/canary-vendor-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: docVendorId, document_name: docName, document_url: docUrl, document_type: docType }) });
      const data = await res.json();
      if (data.ok) { showMsg('Document recorded successfully'); setDocVendorId(''); setDocName(''); setDocUrl(''); setDocType(''); await fetchData(); }
      else showMsg(data.error?.message ?? 'Upload failed', 'error');
    } catch { showMsg('Network error', 'error'); } finally { setLoading(false); }
  };

  const handleApproveAction = async (action: 'approve' | 'reject') => {
    if (!approveVendorId) { showMsg('Select a vendor first', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/canary-vendors/${approveVendorId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review_note: reviewNote, action }) });
      const data = await res.json();
      if (data.ok) { showMsg(`Vendor ${action === 'approve' ? 'approved' : 'rejected'} successfully`); setApproveVendorId(''); setReviewNote(''); await fetchData(); }
      else showMsg(data.error?.message ?? 'Action failed', 'error');
    } catch { showMsg('Network error', 'error'); } finally { setLoading(false); }
  };

  const pendingVendors = vendors.filter(v => v.status === 'pending');
  const approvedVendors = vendors.filter(v => v.status === 'approved');
  const rejectedVendors = vendors.filter(v => v.status === 'rejected');

  const tabs = [
    { key: 'dashboard' as TabKey,     label: 'Dashboard',      icon: BarChart3 },
    { key: 'onboard' as TabKey,       label: 'Register Vendor', icon: Building2 },
    { key: 'documents' as TabKey,     label: 'Documents',       icon: FileText },
    { key: 'admin' as TabKey,         label: 'Admin Approval',  icon: ShieldCheck },
    { key: 'notifications' as TabKey, label: 'Activity',        icon: Bell },
  ];

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--vc-border)', borderRadius: 6, fontSize: 14, color: 'var(--vc-text-primary)', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--vc-text-primary)', marginBottom: 6 };
  const card: React.CSSProperties = { backgroundColor: 'var(--vc-surface-card)', border: '1px solid var(--vc-border)', borderRadius: 8 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--vc-surface)', fontFamily: 'var(--font-body)' }}>

      {/* ── HERO / LANDING ── */}
      <section style={{ backgroundColor: 'var(--vc-primary)', borderBottom: '3px solid var(--vc-accent)', padding: '0' }}>
        {/* Top bar */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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

        {/* Hero content */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 40px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,95,3,0.18)', border: '1px solid rgba(255,95,3,0.35)', borderRadius: 20, padding: '4px 14px', marginBottom: 20 }}>
              <ShieldCheck size={13} color="var(--vc-accent)" />
              <span style={{ fontSize: 12, color: 'var(--vc-accent)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Enterprise Compliance</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--vc-on-primary)', letterSpacing: '0.02em', lineHeight: 1.15, marginBottom: 16, textTransform: 'uppercase' }}>
              Vendor onboarding<br />
              <span style={{ color: 'var(--vc-accent)' }}>done right.</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--vc-header-sub)', lineHeight: 1.6, maxWidth: 520, marginBottom: 28 }}>
              Screen vendors, collect compliance documents, and approve suppliers — all in one audit-ready portal. Every decision is logged, every document is tracked.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('onboard')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', backgroundColor: 'var(--vc-accent)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}>
                Register Vendor <ArrowRight size={16} />
              </button>
              <button onClick={() => setActiveTab('admin')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                Admin Approval
              </button>
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}>
            {[
              { label: 'Total Vendors',  value: vendors.length,         color: 'var(--vc-accent)' },
              { label: 'Pending Review', value: pendingVendors.length,  color: '#f59e0b' },
              { label: 'Approved',       value: approvedVendors.length, color: '#34d399' },
              { label: 'Rejected',       value: rejectedVendors.length, color: '#f87171' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                <span style={{ fontSize: 13, color: 'var(--vc-header-sub)' }}>{label}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {message && (
        <div style={{ backgroundColor: messageType === 'success' ? '#dcfce7' : '#fee2e2', borderBottom: `1px solid ${messageType === 'success' ? '#86efac' : '#fca5a5'}`, padding: '10px 24px', textAlign: 'center', fontSize: 14, color: messageType === 'success' ? '#166534' : '#991b1b', fontWeight: 500 }}>
          {message}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tab nav */}
        <nav style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--vc-border)' }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 14, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? 'var(--vc-primary)' : 'var(--vc-text-muted)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === key ? '2px solid var(--vc-accent)' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
              <Icon size={16} strokeWidth={1.8} />{label}
              {key === 'admin' && pendingVendors.length > 0 && (
                <span style={{ background: 'var(--vc-accent)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{pendingVendors.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── DASHBOARD ── */}
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Compliance Dashboard</h2>
          <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 24 }}>Real-time overview of vendor onboarding and approval status</p>
          {vendors.length > 0 ? (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--vc-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--vc-primary)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Vendor Registry</h3>
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
            <div style={{ ...card, border: '1px dashed var(--vc-border)', padding: '48px 24px', textAlign: 'center' }}>
              <Building2 size={40} color="var(--vc-text-faint)" strokeWidth={1.4} style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--vc-text-muted)', fontSize: 14 }}>No vendors registered yet. Use the <strong>Register Vendor</strong> tab to onboard your first vendor.</p>
            </div>
          )}
        </div>

        {/* ── ONBOARD ── */}
        <div style={{ display: activeTab === 'onboard' ? 'block' : 'none', maxWidth: 560 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Register Vendor</h2>
          <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 24 }}>Submit a new vendor for compliance review and approval</p>
          <form onSubmit={handleRegisterVendor} style={{ ...card, padding: 28 }}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="vendor_email" style={lbl}>Vendor Email</label>
              <input id="vendor_email" type="email" required value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} placeholder="vendor@company.com" style={inp} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="company_name" style={lbl}>Company Name</label>
              <input id="company_name" type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Supplies Ltd." style={inp} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="category" style={lbl}>Category</label>
              <input id="category" type="text" required value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Logistics, IT Services, Facilities" style={inp} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="risk_level" style={lbl}>Risk Level</label>
              <select id="risk_level" value={riskLevel} onChange={e => setRiskLevel(e.target.value)} style={inp}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px 24px', backgroundColor: loading ? 'var(--vc-primary-mid)' : 'var(--vc-primary)', color: 'var(--vc-on-primary)', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
              {loading ? 'Submitting…' : 'Submit Vendor for Review'}
            </button>
          </form>
        </div>

        {/* ── DOCUMENTS ── */}
        <div style={{ display: activeTab === 'documents' ? 'block' : 'none', maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Document Upload</h2>
          <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 24 }}>Record compliance documents for a vendor</p>
          <form onSubmit={handleUploadDocument} style={{ ...card, padding: 28 }}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="doc_vendor" style={lbl}>Vendor</label>
              <select id="doc_vendor" required value={docVendorId} onChange={e => setDocVendorId(e.target.value)} style={inp}>
                <option value="">Select vendor…</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_email})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="doc_name" style={lbl}>Document Name</label>
              <input id="doc_name" type="text" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. insurance.pdf" style={inp} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="doc_url" style={lbl}>Document URL</label>
              <input id="doc_url" type="url" required value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://example.com/document.pdf" style={inp} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="doc_type" style={lbl}>Document Type</label>
              <select id="doc_type" required value={docType} onChange={e => setDocType(e.target.value)} style={inp}>
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

        {/* ── ADMIN APPROVAL ── */}
        <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Admin Approval Queue</h2>
          <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 24 }}>Review and approve or reject vendor compliance submissions</p>

          {vendors.length > 0 && (
            <div style={{ ...card, overflow: 'hidden', marginBottom: 28 }}>
              <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--vc-border)', backgroundColor: 'var(--vc-accent-header-bg)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--vc-accent-text)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Vendor Review Queue</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--vc-neutral-tint)' }}>
                      {['Company', 'Email', 'Category', 'Risk', 'Status', 'Doc Count', 'Updated', 'Reviewer Note'].map(h => (
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
          )}

          <div style={{ maxWidth: 500, ...card, padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 20, textTransform: 'uppercase' }}>Review Decision</h3>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="approve_vendor" style={lbl}>Select Vendor</label>
              <select id="approve_vendor" value={approveVendorId} onChange={e => setApproveVendorId(e.target.value)} style={inp}>
                <option value="">Select vendor…</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company_name} — {v.status}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="review_note" style={lbl}>Reviewer Note</label>
              <textarea id="review_note" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add a compliance note or reason…" rows={3}
                style={{ ...inp, resize: 'vertical' }} />
            </div>
            {/* Approve and Reject as separate always-visible buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => handleApproveAction('approve')} disabled={loading} aria-label="approve vendor"
                style={{ flex: 1, padding: '11px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s' }}>
                <CheckCircle size={16} /> Approve
              </button>
              <button type="button" onClick={() => handleApproveAction('reject')} disabled={loading} aria-label="reject vendor"
                style={{ flex: 1, padding: '11px 20px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s' }}>
                <XCircle size={16} /> Reject
              </button>
            </div>
          </div>
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--vc-primary)', letterSpacing: '0.02em', marginBottom: 6 }}>Activity &amp; Notifications</h2>
          <p style={{ color: 'var(--vc-text-muted)', fontSize: 14, marginBottom: 24 }}>Audit trail of all compliance events and system notifications</p>
          {notifications.length > 0 ? (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--vc-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--vc-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Notification History</h3>
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
            <div style={{ ...card, border: '1px dashed var(--vc-border)', padding: '48px 24px', textAlign: 'center' }}>
              <Bell size={40} color="var(--vc-text-faint)" strokeWidth={1.4} style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--vc-text-muted)', fontSize: 14 }}>No notifications yet. Register a vendor or complete an approval to generate activity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
