"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, FileText, ShieldCheck, Bell,
  CheckCircle, XCircle, Clock, Upload, Plus, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Vendor = {
  id: string;
  vendorEmail?: string; vendor_email?: string;
  companyName?: string; company_name?: string;
  category: string;
  riskLevel?: string; risk_level?: string;
  status: string;
  reviewNote?: string; review_note?: string;
  reviewedAt?: string; reviewed_at?: string;
  createdAt?: string;  created_at?: string;
};
type VendorDoc = {
  id: string;
  vendorId?: string;     vendor_id?: string;
  documentName?: string; document_name?: string;
  documentType?: string; document_type?: string;
  createdAt?: string;    created_at?: string;
};
type Notification = {
  id: string; type: string; message: string; status: string;
  createdAt?: string; created_at?: string;
};

// Two-color semantic system: primary tint = approved/sent, accent tint = pending/warning, muted = rejected
const ST: Record<string, React.CSSProperties> = {
  pending:  { background: "var(--vc-accent-tint)",  color: "var(--vc-accent)",   border: "1px solid #ffc9a8" },
  approved: { background: "var(--vc-primary-tint)", color: "var(--vc-primary)",  border: "1px solid #9ec4c0" },
  rejected: { background: "#f5f5f5",                color: "#555",              border: "1px solid #ddd" },
  sent:     { background: "var(--vc-primary-tint)", color: "var(--vc-primary)",  border: "1px solid #9ec4c0" },
};
const RISK: Record<string, React.CSSProperties> = {
  low:    { background: "var(--vc-primary-tint)", color: "var(--vc-primary)",  border: "1px solid #9ec4c0" },
  medium: { background: "var(--vc-accent-tint)",  color: "var(--vc-accent)",   border: "1px solid #ffc9a8" },
  high:   { background: "#f5f5f5",                color: "#555",              border: "1px solid #ddd" },
};
const SI: Record<string, React.ReactNode> = {
  pending:  <Clock className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

export default function Home() {
  const [vendors,       setVendors]       = useState<Vendor[]>([]);
  const [documents,     setDocuments]     = useState<VendorDoc[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [submitMsg,setSubmitMsg]= useState("");
  const [docMsg,   setDocMsg]   = useState("");
  const [actMsg,   setActMsg]   = useState("");

  const [vEmail,  setVEmail]  = useState("");
  const [vName,   setVName]   = useState("");
  const [vCat,    setVCat]    = useState("");
  const [vRisk,   setVRisk]   = useState("medium");
  const [dVid,    setDVid]    = useState("");
  const [dName,   setDName]   = useState("");
  const [dUrl,    setDUrl]    = useState("");
  const [dType,   setDType]   = useState("");

  const load = useCallback(async () => {
    const [a,b,c] = await Promise.all([
      fetch("/api/canary-vendors").catch(()=>null),
      fetch("/api/canary-vendor-documents").catch(()=>null),
      fetch("/api/canary-notifications").catch(()=>null),
    ]);
    if (a?.ok) { const j=await a.json(); setVendors(j.vendors??[]); }
    if (b?.ok) { const j=await b.json(); setDocuments(j.documents??[]); }
    if (c?.ok) { const j=await c.json(); setNotifications(j.notifications??[]); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const onVendor = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setSubmitMsg("");
    try {
      const r = await fetch("/api/canary-vendors",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({vendor_email:vEmail,company_name:vName,category:vCat,risk_level:vRisk}),
      });
      const d = await r.json();
      if (d.ok) { setSubmitMsg(`"${vName}" added to review queue.`); setVEmail("");setVName("");setVCat("");setVRisk("medium"); load(); }
      else setSubmitMsg(d.error??"Registration failed.");
    } catch { setSubmitMsg("Network error."); } finally { setLoading(false); }
  };

  const onDoc = async (e: React.FormEvent) => {
    e.preventDefault(); setDocMsg("");
    try {
      const r = await fetch("/api/canary-vendor-documents",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({vendor_id:dVid,document_name:dName,document_url:dUrl,document_type:dType}),
      });
      const d = await r.json();
      if (d.ok) { setDocMsg(`"${dName}" saved.`); setDVid("");setDName("");setDUrl("");setDType(""); load(); }
      else setDocMsg(d.error??"Save failed.");
    } catch { setDocMsg("Network error."); }
  };

  const doAction = async (id:string, action:"approved"|"rejected") => {
    setActMsg("");
    try {
      const r = await fetch(`/api/canary-vendors/${id}/approve`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({review_note:`${action=="approved"?"Approved":"Rejected"} via dashboard`,action}),
      });
      const d = await r.json();
      if (d.ok) { setActMsg(action=="approved"?"Vendor approved — compliance confirmed.":"Vendor rejected."); load(); }
      else setActMsg(d.error??"Action failed.");
    } catch { setActMsg("Network error."); }
  };

  const total    = vendors.length;
  const pending  = vendors.filter(v=>v.status==="pending").length;
  const approved = vendors.filter(v=>v.status==="approved").length;
  const docCount = documents.length;
  // Compliance score: percentage of vendors approved out of total (0 if none)
  const compScore = total > 0 ? Math.round((approved/total)*100) : 0;

  return (
    <div style={{minHeight:"100vh",backgroundColor:"var(--vc-surface)",fontFamily:"var(--font-body)"}}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{backgroundColor:"var(--vc-primary)",borderBottom:"1px solid var(--vc-primary-mid)",position:"sticky",top:0,zIndex:10}}>
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" style={{color:"var(--vc-accent)"}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"1.15rem",fontWeight:600,color:"#fff",letterSpacing:"-0.01em"}}>VendorGuard</span>
            <span className="hidden sm:block text-xs px-2 py-0.5 rounded" style={{backgroundColor:"rgba(255,95,3,.14)",color:"var(--vc-accent)"}}>Compliance Portal</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{color:"var(--vc-header-sub)"}}>
            <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5"/>{notifications.length} alerts</span>
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5"/>{total} vendors</span>
          </div>
        </div>
      </header>

      {/* ── Compliance Score Banner (distinctive section) ── */}
      <div style={{backgroundColor:"var(--vc-primary-mid)",padding:"1.25rem 0"}}>
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div>
            <p className="label-xs" style={{color:"var(--vc-header-sub)",marginBottom:".25rem"}}>Portfolio Compliance Score</p>
            <div className="flex items-end gap-3">
              <span style={{fontFamily:"var(--font-display)",fontSize:"3rem",fontWeight:700,lineHeight:1,color:"#fff"}}>{compScore}%</span>
              <span className="text-sm" style={{color:"var(--vc-header-sub)",marginBottom:".4rem"}}>{approved} of {total} vendors approved</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{color:"var(--vc-header-sub)"}}>
            <div className="text-center">
              <div style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",fontWeight:600,color:"var(--vc-accent)"}}>{pending}</div>
              <div className="label-xs">Awaiting review</div>
            </div>
            <div className="text-center">
              <div style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",fontWeight:600,color:"#fff"}}>{docCount}</div>
              <div className="label-xs">Documents on file</div>
            </div>
            <div className="text-center">
              <div style={{fontFamily:"var(--font-display)",fontSize:"1.75rem",fontWeight:600,color:"#fff"}}>{notifications.length}</div>
              <div className="label-xs">Activity events</div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* ── Onboarding + Document forms ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">

          {/* Vendor Onboarding */}
          <section>
            <p className="label-xs mb-3">Register Vendor</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",padding:"1.5rem"}}>
              <form onSubmit={onVendor} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="vendor_email" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Vendor Email</Label>
                    <Input id="vendor_email" type="email" placeholder="vendor@company.com" value={vEmail} onChange={e=>setVEmail(e.target.value)} required className="mt-1 h-9 text-sm"/>
                  </div>
                  <div>
                    <Label htmlFor="company_name" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Company Name</Label>
                    <Input id="company_name" placeholder="Acme Supplies" value={vName} onChange={e=>setVName(e.target.value)} required className="mt-1 h-9 text-sm"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Category</Label>
                    <Input id="category" placeholder="Logistics, IT…" value={vCat} onChange={e=>setVCat(e.target.value)} required className="mt-1 h-9 text-sm"/>
                  </div>
                  <div>
                    <Label htmlFor="risk_level" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Risk Level</Label>
                    <select id="risk_level" value={vRisk} onChange={e=>setVRisk(e.target.value)}
                      className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm h-9"
                      style={{borderColor:"var(--vc-border)",backgroundColor:"var(--vc-surface-card)",color:"var(--vc-text-primary)"}}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-9 text-sm font-semibold" style={{backgroundColor:"var(--vc-accent)",color:"#fff"}}>
                  <Plus className="h-3.5 w-3.5 mr-1.5"/>{loading?"Registering…":"Register Vendor"}
                </Button>
                {submitMsg && <p className="text-xs" style={{color:submitMsg.includes("added")?"var(--vc-primary)":"var(--vc-accent)"}}>{submitMsg}</p>}
              </form>
            </Card>
          </section>

          {/* Document Record */}
          <section>
            <p className="label-xs mb-3">Record Document</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",padding:"1.5rem"}}>
              <form onSubmit={onDoc} className="space-y-3">
                <div>
                  <Label htmlFor="doc_vendor_id" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Vendor ID</Label>
                  <Input id="doc_vendor_id" placeholder="Paste vendor UUID" value={dVid} onChange={e=>setDVid(e.target.value)} required className="mt-1 h-9 text-sm font-mono"/>
                </div>
                <div>
                  <Label htmlFor="doc_name" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Document Name</Label>
                  <Input id="doc_name" placeholder="insurance.pdf" value={dName} onChange={e=>setDName(e.target.value)} required className="mt-1 h-9 text-sm"/>
                </div>
                <div>
                  <Label htmlFor="doc_url" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Document URL</Label>
                  <Input id="doc_url" type="url" placeholder="https://…" value={dUrl} onChange={e=>setDUrl(e.target.value)} required className="mt-1 h-9 text-sm"/>
                </div>
                <div>
                  <Label htmlFor="doc_type" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Type</Label>
                  <Input id="doc_type" placeholder="insurance, contract…" value={dType} onChange={e=>setDType(e.target.value)} required className="mt-1 h-9 text-sm"/>
                </div>
                <Button type="submit" className="w-full h-9 text-sm font-semibold" style={{backgroundColor:"var(--vc-primary)",color:"#fff"}}>
                  <Upload className="h-3.5 w-3.5 mr-1.5"/>Save Document
                </Button>
                {docMsg && <p className="text-xs" style={{color:docMsg.includes("saved")?"var(--vc-primary)":"var(--vc-accent)"}}>{docMsg}</p>}
              </form>
            </Card>
          </section>
        </div>

        {/* ── Admin Approval Queue ─────────────────────── */}
        <section aria-label="approval">
          <div className="flex items-center justify-between mb-3">
            <p className="label-xs">Admin Approval Queue</p>
            {actMsg && <span className="text-xs font-medium" style={{color:"var(--vc-primary)"}}>{actMsg}</span>}
          </div>
          <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",overflow:"hidden"}}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{fontSize:"0.8125rem"}}>
                <thead>
                  <tr style={{backgroundColor:"var(--vc-surface)",borderBottom:"1px solid var(--vc-border)"}}>
                    {["Company","Email","Category","Risk","Status","Docs","Reviewer Note","Updated","Actions"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left" style={{color:"var(--vc-text-muted)",fontWeight:600,fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.length===0 && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center" style={{color:"var(--vc-text-faint)"}}>
                      <AlertTriangle className="h-5 w-5 mx-auto mb-2" style={{color:"var(--vc-accent)"}}/>
                      No vendors registered yet — use the form above to add the first vendor.
                    </td></tr>
                  )}
                  {vendors.map(v=>{
                    const dCnt = documents.filter(d=>(d.vendorId??d.vendor_id)===v.id).length;
                    const risk = v.riskLevel??v.risk_level??"medium";
                    return (
                      <tr key={v.id} style={{borderBottom:"1px solid var(--vc-border)",backgroundColor:"var(--vc-surface-card)"}}>
                        <td className="px-4 py-3 font-medium" style={{color:"var(--vc-text-primary)"}}>{v.companyName??v.company_name}</td>
                        <td className="px-4 py-3" style={{color:"var(--vc-text-muted)",fontSize:"0.75rem"}}>{v.vendorEmail??v.vendor_email}</td>
                        <td className="px-4 py-3" style={{color:"var(--vc-text-body)"}}>{v.category}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium" style={RISK[risk]??RISK.medium}>{risk}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={ST[v.status]??ST.pending}>
                            {SI[v.status]??SI.pending}{v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" style={{color:"var(--vc-text-body)"}}>{dCnt}</td>
                        <td className="px-4 py-3" style={{color:"var(--vc-text-muted)",maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {v.reviewNote??v.review_note??"—"}
                        </td>
                        <td className="px-4 py-3" style={{color:"var(--vc-text-faint)",fontSize:"0.75rem"}}>
                          {(v.reviewedAt??v.reviewed_at)
                            ? new Date((v.reviewedAt??v.reviewed_at)!).toLocaleDateString()
                            : new Date(v.createdAt??v.created_at??"").toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {v.status==="pending" ? (
                            <div className="flex gap-1.5">
                              <button onClick={()=>doAction(v.id,"approved")} aria-label="approve vendor"
                                className="text-xs px-2.5 py-1 rounded font-semibold"
                                style={{backgroundColor:"var(--vc-accent)",color:"#fff"}}>Approve</button>
                              <button onClick={()=>doAction(v.id,"rejected")} aria-label="reject vendor"
                                className="text-xs px-2.5 py-1 rounded font-semibold"
                                style={{backgroundColor:"var(--vc-surface)",color:"var(--vc-text-body)",border:"1px solid var(--vc-border)"}}>Reject</button>
                            </div>
                          ) : (
                            <span style={{fontSize:"0.75rem",color:"var(--vc-text-faint)"}}>Reviewed</span>
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

        {/* ── Activity + Documents side-by-side ───────── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">

          {/* Notification Activity Feed */}
          <section aria-label="notification">
            <p className="label-xs mb-3">Activity &amp; Notifications</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)"}}>
              {notifications.length===0 && (
                <div className="px-6 py-8 text-center text-sm" style={{color:"var(--vc-text-faint)"}}>No activity yet.</div>
              )}
              <ul>
                {notifications.slice(0,8).map((n,i)=>(
                  <li key={n.id} className="flex items-start gap-3 px-5 py-3.5"
                    style={{borderBottom: i<Math.min(notifications.length,8)-1?"1px solid var(--vc-border)":"none"}}>
                    <Bell className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{color:"var(--vc-accent)"}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{color:"var(--vc-text-primary)"}}>{n.message}</p>
                      <p className="text-xs mt-0.5" style={{color:"var(--vc-text-faint)"}}>{n.type} &middot; {new Date(n.createdAt??n.created_at??"").toLocaleString()}</p>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={ST[n.status]??ST.pending}>{n.status}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Document List */}
          <section>
            <p className="label-xs mb-3">Documents on File</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)"}}>
              {documents.length===0 && (
                <div className="px-5 py-8 text-center text-sm" style={{color:"var(--vc-text-faint)"}}>No documents yet.</div>
              )}
              <ul>
                {documents.slice(0,8).map((d,i)=>(
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3"
                    style={{borderBottom: i<Math.min(documents.length,8)-1?"1px solid var(--vc-border)":"none"}}>
                    <FileText className="h-4 w-4 flex-shrink-0" style={{color:"var(--vc-accent)"}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{color:"var(--vc-text-primary)"}}>{d.documentName??d.document_name}</p>
                      <p className="text-xs" style={{color:"var(--vc-text-faint)"}}>{d.documentType??d.document_type} &middot; {(d.vendorId??d.vendor_id??"").slice(0,8)}…</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>

      </main>

      <footer style={{backgroundColor:"var(--vc-primary)",borderTop:"1px solid var(--vc-primary-mid)",padding:"1.25rem 1.5rem",marginTop:"3rem"}}>
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{color:"var(--vc-accent)"}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",fontWeight:600,color:"#fff"}}>VendorGuard</span>
          </div>
          <p style={{fontSize:"0.75rem",color:"var(--vc-header-sub)"}}>Vendor compliance &amp; onboarding — keep your supply chain audit-ready</p>
        </div>
      </footer>
    </div>
  );
}
