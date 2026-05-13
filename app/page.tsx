"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, FileText, ShieldCheck, Bell, CheckCircle, XCircle, Clock, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Vendor = {
  id: string;
  vendor_email: string;
  vendorEmail?: string;
  company_name: string;
  companyName?: string;
  category: string;
  risk_level: string;
  riskLevel?: string;
  status: string;
  review_note?: string;
  reviewNote?: string;
  reviewed_at?: string;
  reviewedAt?: string;
  created_at?: string;
  createdAt?: string;
};

type VendorDoc = {
  id: string;
  vendor_id?: string;
  vendorId?: string;
  document_name?: string;
  documentName?: string;
  document_type?: string;
  documentType?: string;
  created_at?: string;
  createdAt?: string;
};

type Notification = {
  id: string;
  type: string;
  message: string;
  status: string;
  created_at?: string;
  createdAt?: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="section-label mb-4"
      style={{ color: "var(--vc-primary)" }}
    >
      {children}
    </h2>
  );
}

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [documents, setDocuments] = useState<VendorDoc[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [docMsg, setDocMsg] = useState("");
  const [approveMsg, setApproveMsg] = useState("");

  const [vendorEmail, setVendorEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");

  const [docVendorId, setDocVendorId] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docType, setDocType] = useState("");

  const fetchAll = useCallback(async () => {
    const [vRes, dRes, nRes] = await Promise.all([
      fetch("/api/canary-vendors").catch(() => null),
      fetch("/api/canary-vendor-documents").catch(() => null),
      fetch("/api/canary-notifications").catch(() => null),
    ]);
    if (vRes?.ok) { const d = await vRes.json(); setVendors(d.vendors ?? []); }
    if (dRes?.ok) { const d = await dRes.json(); setDocuments(d.documents ?? []); }
    if (nRes?.ok) { const d = await nRes.json(); setNotifications(d.notifications ?? []); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMsg("");
    try {
      const res = await fetch("/api/canary-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_email: vendorEmail, company_name: companyName, category, risk_level: riskLevel }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitMsg(`Vendor "${companyName}" registered successfully.`);
        setVendorEmail(""); setCompanyName(""); setCategory(""); setRiskLevel("medium");
        fetchAll();
      } else {
        setSubmitMsg(data.error ?? "Registration failed.");
      }
    } catch { setSubmitMsg("Network error."); }
    finally { setLoading(false); }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocMsg("");
    try {
      const res = await fetch("/api/canary-vendor-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: docVendorId, document_name: docName, document_url: docUrl, document_type: docType }),
      });
      const data = await res.json();
      if (data.ok) {
        setDocMsg(`Document "${docName}" saved successfully.`);
        setDocVendorId(""); setDocName(""); setDocUrl(""); setDocType("");
        fetchAll();
      } else { setDocMsg(data.error ?? "Failed to save document."); }
    } catch { setDocMsg("Network error."); }
  };

  const handleApprove = async (vendorId: string) => {
    setApproveMsg("");
    try {
      const res = await fetch(`/api/canary-vendors/${vendorId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: "Approved via dashboard", action: "approved" }),
      });
      const data = await res.json();
      if (data.ok) { setApproveMsg("Vendor approved."); fetchAll(); }
      else { setApproveMsg(data.error ?? "Approval failed."); }
    } catch { setApproveMsg("Network error."); }
  };

  const handleReject = async (vendorId: string) => {
    setApproveMsg("");
    try {
      const res = await fetch(`/api/canary-vendors/${vendorId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: "Rejected via dashboard", action: "rejected" }),
      });
      const data = await res.json();
      if (data.ok) { setApproveMsg("Vendor rejected."); fetchAll(); }
      else { setApproveMsg(data.error ?? "Rejection failed."); }
    } catch { setApproveMsg("Network error."); }
  };

  const total = vendors.length;
  const pending = vendors.filter((v) => v.status === "pending").length;
  const approved = vendors.filter((v) => v.status === "approved").length;
  const docCount = documents.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--vc-surface)", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: "var(--vc-primary)", borderColor: "var(--vc-primary-dark)" }}>
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" style={{ color: "var(--vc-accent)" }} />
            <span className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>VendorGuard</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--vc-accent-muted)", color: "var(--vc-accent)" }}>Compliance Portal</span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--vc-header-text)" }}>
            <span className="flex items-center gap-1.5"><Bell className="h-4 w-4" />{notifications.length} alerts</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{total} vendors</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Dashboard metrics */}
        <section aria-label="dashboard">
          <SectionLabel>Dashboard Overview</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Vendors", value: total, icon: <Building2 className="h-5 w-5" />, color: "var(--vc-primary)" },
              { label: "Pending Review", value: pending, icon: <Clock className="h-5 w-5" />, color: "var(--vc-warning)" },
              { label: "Approved", value: approved, icon: <CheckCircle className="h-5 w-5" />, color: "var(--vc-success)" },
              { label: "Documents", value: docCount, icon: <FileText className="h-5 w-5" />, color: "var(--vc-accent)" },
            ].map((m) => (
              <Card key={m.label} className="p-5 border" style={{ backgroundColor: "var(--vc-surface-card)", borderColor: "var(--vc-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--vc-text-muted)" }}>{m.label}</span>
                  <span style={{ color: m.color }}>{m.icon}</span>
                </div>
                <div className="font-display text-4xl font-bold leading-none" style={{ color: "var(--vc-text-primary)", fontFamily: "var(--font-display)" }}>{m.value}</div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor Onboarding Form */}
          <section>
            <SectionLabel>Register Vendor</SectionLabel>
            <Card className="p-6 border" style={{ backgroundColor: "var(--vc-surface-card)", borderColor: "var(--vc-border)" }}>
              <form onSubmit={handleVendorSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vendor_email" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Vendor Email</Label>
                  <Input id="vendor_email" type="email" placeholder="vendor@company.com" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="company_name" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Company Name</Label>
                  <Input id="company_name" placeholder="Acme Supplies" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Category</Label>
                  <Input id="category" placeholder="Logistics, IT, Finance…" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="risk_level" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Risk Level</Label>
                  <select id="risk_level" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--vc-border)", backgroundColor: "var(--vc-surface-card)", color: "var(--vc-text-primary)" }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading} className="w-full font-semibold" style={{ backgroundColor: "var(--vc-primary)", color: "white" }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Registering…" : "Register Vendor"}
                </Button>
                {submitMsg && (
                  <p className="text-sm mt-2" style={{ color: submitMsg.includes("successfully") ? "var(--vc-success)" : "var(--vc-danger)" }}>{submitMsg}</p>
                )}
              </form>
            </Card>
          </section>

          {/* Document Upload Panel */}
          <section>
            <SectionLabel>Record Document</SectionLabel>
            <Card className="p-6 border" style={{ backgroundColor: "var(--vc-surface-card)", borderColor: "var(--vc-border)" }}>
              <form onSubmit={handleDocSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="doc_vendor_id" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Vendor ID</Label>
                  <Input id="doc_vendor_id" placeholder="Paste vendor UUID" value={docVendorId} onChange={(e) => setDocVendorId(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="doc_name" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Document Name</Label>
                  <Input id="doc_name" placeholder="insurance.pdf" value={docName} onChange={(e) => setDocName(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="doc_url" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Document URL</Label>
                  <Input id="doc_url" type="url" placeholder="https://example.com/file.pdf" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="doc_type" className="text-sm font-medium" style={{ color: "var(--vc-text-secondary)" }}>Document Type</Label>
                  <Input id="doc_type" placeholder="insurance, contract, license…" value={docType} onChange={(e) => setDocType(e.target.value)} required className="mt-1" />
                </div>
                <Button type="submit" className="w-full font-semibold" style={{ backgroundColor: "var(--vc-accent)", color: "white" }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Document
                </Button>
                {docMsg && (
                  <p className="text-sm mt-2" style={{ color: docMsg.includes("successfully") ? "var(--vc-success)" : "var(--vc-danger)" }}>{docMsg}</p>
                )}
              </form>
            </Card>
          </section>
        </div>

        {/* Admin Approval Table */}
        <section aria-label="approval">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Admin Approval Queue</SectionLabel>
            {approveMsg && <span className="text-sm font-medium" style={{ color: "var(--vc-success)" }}>{approveMsg}</span>}
          </div>
          <Card className="border overflow-hidden" style={{ backgroundColor: "var(--vc-surface-card)", borderColor: "var(--vc-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--vc-surface-subtle)", borderBottom: "1px solid var(--vc-border)" }}>
                    {["Company","Email","Category","Risk","Status","Docs","Note","Updated","Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "var(--vc-text-secondary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: "var(--vc-text-faint)" }}>No vendors registered yet.</td></tr>
                  )}
                  {vendors.map((v) => {
                    const docCountForVendor = documents.filter((d) => (d.vendorId ?? d.vendor_id) === v.id).length;
                    const risk = v.riskLevel ?? v.risk_level ?? "medium";
                    const riskStyle: Record<string, React.CSSProperties> = {
                      low: { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
                      medium: { backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" },
                      high: { backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
                    };
                    const statusStyle: Record<string, React.CSSProperties> = {
                      pending: { backgroundColor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
                      approved: { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
                      rejected: { backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
                    };
                    const statusIcons: Record<string, React.ReactNode> = {
                      pending: <Clock className="h-3.5 w-3.5" />,
                      approved: <CheckCircle className="h-3.5 w-3.5" />,
                      rejected: <XCircle className="h-3.5 w-3.5" />,
                    };
                    return (
                      <tr key={v.id} style={{ borderBottom: "1px solid var(--vc-border-light)" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--vc-text-primary)" }}>{v.companyName ?? v.company_name}</td>
                        <td className="px-4 py-3" style={{ color: "var(--vc-text-muted)" }}>{v.vendorEmail ?? v.vendor_email}</td>
                        <td className="px-4 py-3" style={{ color: "var(--vc-text-secondary)" }}>{v.category}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={riskStyle[risk] ?? riskStyle.medium}>{risk}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={statusStyle[v.status] ?? statusStyle.pending}>
                            {statusIcons[v.status] ?? statusIcons.pending}{v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: "var(--vc-text-secondary)" }}>{docCountForVendor}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--vc-text-muted)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.reviewNote ?? v.review_note ?? "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--vc-text-faint)" }}>
                          {v.reviewedAt ?? v.reviewed_at
                            ? new Date((v.reviewedAt ?? v.reviewed_at)!).toLocaleDateString()
                            : new Date(v.createdAt ?? v.created_at ?? "").toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {v.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApprove(v.id)} className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: "var(--vc-success)", color: "white" }} aria-label="approve vendor">Approve</button>
                              <button onClick={() => handleReject(v.id)} className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: "var(--vc-danger)", color: "white" }} aria-label="reject vendor">Reject</button>
                            </div>
                          )}
                          {v.status !== "pending" && <span className="text-xs" style={{ color: "var(--vc-text-faint)" }}>Reviewed</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Notification Activity Feed */}
        <section aria-label="notification">
          <SectionLabel>Activity &amp; Notifications</SectionLabel>
          <Card className="border" style={{ backgroundColor: "var(--vc-surface-card)", borderColor: "var(--vc-border)" }}>
            {notifications.length === 0 && (
              <div className="px-6 py-8 text-center" style={{ color: "var(--vc-text-faint)" }}>No activity yet.</div>
            )}
            <ul className="divide-y" style={{ borderColor: "var(--vc-border-light)" }}>
              {notifications.slice(0, 10).map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-6 py-4">
                  <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--vc-accent)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--vc-text-primary)" }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--vc-text-faint)" }}>{n.type} &middot; {new Date(n.createdAt ?? n.created_at ?? "").toLocaleString()}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={n.status === "sent"
                    ? { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }
                    : { backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
                    {n.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Document List */}
        <section>
          <SectionLabel>Uploaded Documents</SectionLabel>
          <Card className="border overflow-hidden" style={{ backgroundColor: "var(--vc-surface-card)", borderColor: "var(--vc-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--vc-surface-subtle)", borderBottom: "1px solid var(--vc-border)" }}>
                    {["Document","Type","Vendor ID","Uploaded"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "var(--vc-text-secondary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--vc-text-faint)" }}>No documents recorded yet.</td></tr>
                  )}
                  {documents.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid var(--vc-border-light)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--vc-text-primary)" }}>
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" style={{ color: "var(--vc-accent)" }} />
                          {d.documentName ?? d.document_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: "#f3f4f6", borderColor: "var(--vc-border)", color: "var(--vc-text-secondary)" }}>
                          {d.documentType ?? d.document_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--vc-text-muted)" }}>{(d.vendorId ?? d.vendor_id ?? "").slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--vc-text-faint)" }}>{new Date(d.createdAt ?? d.created_at ?? "").toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

      </main>

      <footer className="border-t mt-12 px-6 py-6" style={{ backgroundColor: "var(--vc-primary)", borderColor: "var(--vc-primary-dark)" }}>
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--vc-accent)" }} />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>VendorGuard</span>
          </div>
          <p className="text-xs" style={{ color: "var(--vc-header-text)" }}>Vendor compliance &amp; onboarding platform</p>
        </div>
      </footer>
    </div>
  );
}
