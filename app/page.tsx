"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, FileText, ShieldCheck, Bell, BarChart3, CheckCircle, XCircle, Clock, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const riskColor: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [documents, setDocuments] = useState<VendorDoc[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [docMsg, setDocMsg] = useState("");
  const [approveMsg, setApproveMsg] = useState("");

  // Vendor form state
  const [vendorEmail, setVendorEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("");
  const [riskLevel, setRiskLevel] = useState("medium");

  // Document form state
  const [docVendorId, setDocVendorId] = useState("");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docType, setDocType] = useState("");

  const fetchAll = useCallback(async () => {
    const [vRes, dRes, nRes] = await Promise.all([
      fetch("/api/canary-vendors"),
      fetch("/api/canary-vendor-documents"),
      fetch("/api/canary-notifications"),
    ]);
    const vData = await vRes.json();
    const dData = await dRes.json();
    const nData = await nRes.json();
    setVendors(vData.vendors ?? []);
    setDocuments(dData.documents ?? []);
    setNotifications(nData.notifications ?? []);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMsg("");
    try {
      const res = await fetch("/api/canary-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_email: vendorEmail,
          company_name: companyName,
          category,
          risk_level: riskLevel,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitMsg(`Vendor "${companyName}" registered successfully.`);
        setVendorEmail("");
        setCompanyName("");
        setCategory("");
        setRiskLevel("medium");
        fetchAll();
      } else {
        setSubmitMsg(data.error ?? "Registration failed.");
      }
    } catch {
      setSubmitMsg("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocMsg("");
    try {
      const res = await fetch("/api/canary-vendor-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: docVendorId,
          document_name: docName,
          document_url: docUrl,
          document_type: docType,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDocMsg(`Document "${docName}" saved successfully.`);
        setDocVendorId("");
        setDocName("");
        setDocUrl("");
        setDocType("");
        fetchAll();
      } else {
        setDocMsg(data.error ?? "Failed to save document.");
      }
    } catch {
      setDocMsg("Network error.");
    }
  };

  const handleApprove = async (vendorId: string) => {
    setApproveMsg("");
    try {
      const res = await fetch(`/api/canary-vendors/${vendorId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: "Approved via dashboard" }),
      });
      const data = await res.json();
      if (data.ok) {
        setApproveMsg("Vendor approved.");
        fetchAll();
      } else {
        setApproveMsg(data.error ?? "Approval failed.");
      }
    } catch {
      setApproveMsg("Network error.");
    }
  };

  const handleReject = async (vendorId: string) => {
    setApproveMsg("");
    try {
      const res = await fetch(`/api/canary-vendors/${vendorId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_note: "Rejected via dashboard", status: "rejected" }),
      });
      const data = await res.json();
      if (data.ok) {
        setApproveMsg("Action recorded.");
        fetchAll();
      }
    } catch {
      setApproveMsg("Network error.");
    }
  };

  // Dashboard metrics
  const total = vendors.length;
  const pending = vendors.filter((v) => v.status === "pending").length;
  const approved = vendors.filter((v) => v.status === "approved").length;
  const docCount = documents.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EDEADE", fontFamily: "Ubuntu, system-ui, sans-serif" }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: "#072C2C", borderColor: "#0a3d3d" }}>
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" style={{ color: "#FF5F03" }} />
            <span className="text-lg font-semibold text-white tracking-tight">VendorGuard</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,95,3,0.15)", color: "#FF5F03" }}>Compliance Portal</span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#a0b8b8" }}>
            <span className="flex items-center gap-1.5"><Bell className="h-4 w-4" />{notifications.length} alerts</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{total} vendors</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Dashboard metrics */}
        <section aria-label="dashboard">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#072C2C" }}>Dashboard Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Vendors", value: total, icon: <Building2 className="h-5 w-5" />, accent: "#072C2C" },
              { label: "Pending Review", value: pending, icon: <Clock className="h-5 w-5" />, accent: "#D97706" },
              { label: "Approved", value: approved, icon: <CheckCircle className="h-5 w-5" />, accent: "#16A34A" },
              { label: "Documents", value: docCount, icon: <FileText className="h-5 w-5" />, accent: "#FF5F03" },
            ].map((m) => (
              <Card key={m.label} className="p-5 border" style={{ backgroundColor: "white", borderColor: "#d4d0c8" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium" style={{ color: "#6b7280" }}>{m.label}</span>
                  <span style={{ color: m.accent }}>{m.icon}</span>
                </div>
                <div className="text-3xl font-bold" style={{ color: "#111827" }}>{m.value}</div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor Onboarding Form */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#072C2C" }}>Register Vendor</h2>
            <Card className="p-6 border" style={{ backgroundColor: "white", borderColor: "#d4d0c8" }}>
              <form onSubmit={handleVendorSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vendor_email" className="text-sm font-medium" style={{ color: "#374151" }}>Vendor Email</Label>
                  <Input
                    id="vendor_email"
                    type="email"
                    placeholder="vendor@company.com"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="company_name" className="text-sm font-medium" style={{ color: "#374151" }}>Company Name</Label>
                  <Input
                    id="company_name"
                    placeholder="Acme Supplies"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-medium" style={{ color: "#374151" }}>Category</Label>
                  <Input
                    id="category"
                    placeholder="Logistics, IT, Finance…"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="risk_level" className="text-sm font-medium" style={{ color: "#374151" }}>Risk Level</Label>
                  <select
                    id="risk_level"
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: "#d1d5db", backgroundColor: "white", color: "#111827" }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold"
                  style={{ backgroundColor: "#072C2C", color: "white" }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Registering…" : "Register Vendor"}
                </Button>
                {submitMsg && (
                  <p className="text-sm mt-2" style={{ color: submitMsg.includes("success") || submitMsg.includes("successfully") ? "#16A34A" : "#DC2626" }}>
                    {submitMsg}
                  </p>
                )}
              </form>
            </Card>
          </section>

          {/* Document Upload Panel */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#072C2C" }}>Record Document</h2>
            <Card className="p-6 border" style={{ backgroundColor: "white", borderColor: "#d4d0c8" }}>
              <form onSubmit={handleDocSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="doc_vendor_id" className="text-sm font-medium" style={{ color: "#374151" }}>Vendor ID</Label>
                  <Input
                    id="doc_vendor_id"
                    placeholder="Paste vendor UUID"
                    value={docVendorId}
                    onChange={(e) => setDocVendorId(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="doc_name" className="text-sm font-medium" style={{ color: "#374151" }}>Document Name</Label>
                  <Input
                    id="doc_name"
                    placeholder="insurance.pdf"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="doc_url" className="text-sm font-medium" style={{ color: "#374151" }}>Document URL</Label>
                  <Input
                    id="doc_url"
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="doc_type" className="text-sm font-medium" style={{ color: "#374151" }}>Document Type</Label>
                  <Input
                    id="doc_type"
                    placeholder="insurance, contract, license…"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  style={{ backgroundColor: "#FF5F03", color: "white" }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Save Document
                </Button>
                {docMsg && (
                  <p className="text-sm mt-2" style={{ color: docMsg.includes("success") || docMsg.includes("successfully") ? "#16A34A" : "#DC2626" }}>
                    {docMsg}
                  </p>
                )}
              </form>
            </Card>
          </section>
        </div>

        {/* Admin Approval Table */}
        <section aria-label="approval">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#072C2C" }}>Admin Approval Queue</h2>
            {approveMsg && <span className="text-sm" style={{ color: "#16A34A" }}>{approveMsg}</span>}
          </div>
          <Card className="border overflow-hidden" style={{ backgroundColor: "white", borderColor: "#d4d0c8" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f9f7f3", borderBottom: "1px solid #d4d0c8" }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Company</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Email</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Category</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Risk</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Status</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Docs</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Note</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Updated</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: "#9ca3af" }}>No vendors registered yet.</td></tr>
                  )}
                  {vendors.map((v) => {
                    const docCountForVendor = documents.filter(
                      (d) => (d.vendorId ?? d.vendor_id) === v.id
                    ).length;
                    return (
                      <tr key={v.id} style={{ borderBottom: "1px solid #edeade" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>{v.companyName ?? v.company_name}</td>
                        <td className="px-4 py-3" style={{ color: "#6b7280" }}>{v.vendorEmail ?? v.vendor_email}</td>
                        <td className="px-4 py-3" style={{ color: "#374151" }}>{v.category}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${riskColor[v.riskLevel ?? v.risk_level ?? "medium"]}`}>
                            {v.riskLevel ?? v.risk_level}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusColor[v.status] ?? statusColor.pending}`}>
                            {statusIcon[v.status] ?? statusIcon.pending}
                            {v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: "#374151" }}>{docCountForVendor}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#6b7280", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.reviewNote ?? v.review_note ?? "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9ca3af" }}>
                          {v.reviewedAt ?? v.reviewed_at
                            ? new Date(v.reviewedAt ?? v.reviewed_at!).toLocaleDateString()
                            : new Date(v.createdAt ?? v.created_at ?? "").toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {v.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(v.id)}
                                className="text-xs px-2 py-1 rounded font-medium transition-colors"
                                style={{ backgroundColor: "#16A34A", color: "white" }}
                                aria-label="approve vendor"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(v.id)}
                                className="text-xs px-2 py-1 rounded font-medium transition-colors"
                                style={{ backgroundColor: "#DC2626", color: "white" }}
                                aria-label="reject vendor"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {v.status !== "pending" && (
                            <span className="text-xs" style={{ color: "#9ca3af" }}>Reviewed</span>
                          )}
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
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#072C2C" }}>Activity &amp; Notifications</h2>
          <Card className="border" style={{ backgroundColor: "white", borderColor: "#d4d0c8" }}>
            {notifications.length === 0 && (
              <div className="px-6 py-8 text-center" style={{ color: "#9ca3af" }}>No activity yet.</div>
            )}
            <ul className="divide-y" style={{ borderColor: "#edeade" }}>
              {notifications.slice(0, 10).map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-6 py-4">
                  <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#FF5F03" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "#111827" }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                      {n.type} &middot; {new Date(n.createdAt ?? n.created_at ?? "").toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${n.status === "sent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {n.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Document List */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#072C2C" }}>Uploaded Documents</h2>
          <Card className="border overflow-hidden" style={{ backgroundColor: "white", borderColor: "#d4d0c8" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f9f7f3", borderBottom: "1px solid #d4d0c8" }}>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Document</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Type</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Vendor ID</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: "#374151" }}>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: "#9ca3af" }}>No documents recorded yet.</td></tr>
                  )}
                  {documents.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #edeade" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" style={{ color: "#FF5F03" }} />
                          {d.documentName ?? d.document_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: "#f3f4f6", borderColor: "#d1d5db", color: "#374151" }}>
                          {d.documentType ?? d.document_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "#6b7280" }}>{(d.vendorId ?? d.vendor_id ?? "").slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#9ca3af" }}>
                        {new Date(d.createdAt ?? d.created_at ?? "").toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

      </main>

      <footer className="border-t mt-12 px-6 py-6" style={{ backgroundColor: "#072C2C", borderColor: "#0a3d3d" }}>
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: "#FF5F03" }} />
            <span className="text-sm font-semibold text-white">VendorGuard</span>
          </div>
          <p className="text-xs" style={{ color: "#a0b8b8" }}>Vendor compliance &amp; onboarding platform</p>
        </div>
      </footer>
    </div>
  );
}
