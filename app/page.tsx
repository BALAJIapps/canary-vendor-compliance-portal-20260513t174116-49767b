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
  vendorId?: string; vendor_id?: string;
  documentName?: string; document_name?: string;
  documentType?: string; document_type?: string;
  createdAt?: string; created_at?: string;
};
type Notification = {
  id: string; type: string; message: string; status: string;
  createdAt?: string; created_at?: string;
};

// Two-color semantic system using CSS variables only
const TEAL:   React.CSSProperties = { background:"var(--vc-primary-tint)", color:"var(--vc-primary-text)", border:"1px solid var(--vc-teal-border)" };
const ORANGE: React.CSSProperties = { background:"var(--vc-accent-tint)",  color:"var(--vc-accent-text)",  border:"1px solid var(--vc-orange-border)" };
const GREY:   React.CSSProperties = { background:"var(--vc-neutral-tint)",  color:"var(--vc-neutral-text)", border:"1px solid var(--vc-neutral-border)" };

const ST:   Record<string, React.CSSProperties> = { pending:ORANGE, approved:TEAL, rejected:GREY, sent:TEAL };
const RISK: Record<string, React.CSSProperties> = { low:TEAL, medium:ORANGE, high:GREY };
const SI:   Record<string, React.ReactNode> = {
  pending:  <Clock className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

export default function Home() {
  const [vendors,       setVendors]       = useState<Vendor[]>([]);
  const [documents,     setDocuments]     = useState<VendorDoc[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [docMsg,    setDocMsg]    = useState("");
  const [actMsg,    setActMsg]    = useState("");

  const [vEmail, setVEmail] = useState("");
  const [vName,  setVName]  = useState("");
  const [vCat,   setVCat]   = useState("");
  const [vRisk,  setVRisk]  = useState("medium");
  const [dVid,   setDVid]   = useState("");
  const [dName,  setDName]  = useState("");
  const [dUrl,   setDUrl]   = useState("");
  const [dType,  setDType]  = useState("");

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
      const r = await fetch("/api/canary-vendors",{ method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({vendor_email:vEmail,company_name:vName,category:vCat,risk_level:vRisk}) });
      const d = await r.json();
      if (d.ok) { setSubmitMsg(`"${vName}" added to review queue.`); setVEmail("");setVName("");setVCat("");setVRisk("medium"); load(); }
      else setSubmitMsg(d.error??"Registration failed.");
    } catch { setSubmitMsg("Network error."); } finally { setLoading(false); }
  };

  const onDoc = async (e: React.FormEvent) => {
    e.preventDefault(); setDocMsg("");
    try {
      const r = await fetch("/api/canary-vendor-documents",{ method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({vendor_id:dVid,document_name:dName,document_url:dUrl,document_type:dType}) });
      const d = await r.json();
      if (d.ok) { setDocMsg(`"${dName}" saved.`); setDVid("");setDName("");setDUrl("");setDType(""); load(); }
      else setDocMsg(d.error??"Save failed.");
    } catch { setDocMsg("Network error."); }
  };

  const doAction = async (id:string, action:"approved"|"rejected") => {
    setActMsg("");
    try {
      const r = await fetch(`/api/canary-vendors/${id}/approve`,{ method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({review_note:`${action==="approved"?"Approved":"Rejected"} via dashboard`,action}) });
      const d = await r.json();
      if (d.ok) { setActMsg(action==="approved"?"Vendor approved — compliance confirmed.":"Vendor rejected."); load(); }
      else setActMsg(d.error??"Action failed.");
    } catch { setActMsg("Network error."); }
  };

  const total    = vendors.length;
  const pending  = vendors.filter(v=>v.status==="pending").length;
  const approved = vendors.filter(v=>v.status==="approved").length;
  const docCount = documents.length;
  const compScore = total > 0 ? Math.round((approved/total)*100) : 0;

  const VendorCard = ({ v }: { v: Vendor }) => {
    const dCnt = documents.filter(d=>(d.vendorId??d.vendor_id)===v.id).length;
    const risk = v.riskLevel??v.risk_level??"medium";
    return (
      <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",padding:"1rem"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.5rem",marginBottom:"0.5rem"}}>
          <div>
            <p style={{fontWeight:600,fontSize:"0.9rem",color:"var(--vc-text-primary)",margin:0}}>{v.companyName??v.company_name}</p>
            <p style={{fontSize:"0.75rem",color:"var(--vc-text-muted)",margin:0}}>{v.vendorEmail??v.vendor_email}</p>
          </div>
          <span style={{...ST[v.status]??ORANGE,display:"inline-flex",alignItems:"center",gap:"3px",padding:"2px 8px",borderRadius:"4px",fontSize:"0.72rem",fontWeight:600,flexShrink:0}}>
            {SI[v.status]??SI.pending}{v.status}
          </span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",marginBottom:"0.75rem"}}>
          <span style={{fontSize:"0.72rem",padding:"2px 8px",borderRadius:"4px",backgroundColor:"var(--vc-surface)",color:"var(--vc-text-body)",border:"1px solid var(--vc-border)"}}>{v.category}</span>
          <span style={{...RISK[risk]??ORANGE,display:"inline-block",padding:"2px 8px",borderRadius:"4px",fontSize:"0.72rem",fontWeight:500}}>{risk} risk</span>
          <span style={{fontSize:"0.72rem",padding:"2px 8px",borderRadius:"4px",backgroundColor:"var(--vc-surface)",color:"var(--vc-text-body)",border:"1px solid var(--vc-border)"}}>{dCnt} doc{dCnt!==1?"s":""}</span>
        </div>
        {v.status==="pending" && (
          <div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={()=>doAction(v.id,"approved")} aria-label="approve vendor"
              style={{flex:1,padding:"0.375rem 0",borderRadius:"4px",fontSize:"0.8rem",fontWeight:600,backgroundColor:"var(--vc-accent)",color:"var(--vc-on-accent)",border:"none",cursor:"pointer"}}>Approve</button>
            <button onClick={()=>doAction(v.id,"rejected")} aria-label="reject vendor"
              style={{flex:1,padding:"0.375rem 0",borderRadius:"4px",fontSize:"0.8rem",fontWeight:600,backgroundColor:"var(--vc-surface)",color:"var(--vc-text-body)",border:"1px solid var(--vc-border)",cursor:"pointer"}}>Reject</button>
          </div>
        )}
        {v.status!=="pending" && (
          <p style={{fontSize:"0.72rem",color:"var(--vc-text-faint)",margin:0}}>
            Reviewed {(v.reviewedAt??v.reviewed_at)?new Date((v.reviewedAt??v.reviewed_at)!).toLocaleDateString():""}
          </p>
        )}
      </Card>
    );
  };

  return (
    <div style={{minHeight:"100vh",backgroundColor:"var(--vc-surface)",fontFamily:"var(--font-body)"}}>

      {/* Header */}
      <header style={{backgroundColor:"var(--vc-primary)",borderBottom:"1px solid var(--vc-primary-mid)",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:"80rem",margin:"0 auto",padding:"0.75rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <ShieldCheck className="h-5 w-5" style={{color:"var(--vc-accent)",flexShrink:0}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",fontWeight:600,color:"var(--vc-on-primary)",letterSpacing:"-0.01em"}}>VendorGuard</span>
            <span style={{fontSize:"0.7rem",padding:"2px 8px",borderRadius:"4px",backgroundColor:"var(--vc-accent-header-bg)",color:"var(--vc-accent)"}}>Compliance Portal</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"1rem",fontSize:"0.75rem",color:"var(--vc-header-sub)"}}>
            <span style={{display:"flex",alignItems:"center",gap:"4px"}}><Bell className="h-3.5 w-3.5"/>{notifications.length} alerts</span>
            <span style={{display:"flex",alignItems:"center",gap:"4px"}}><Building2 className="h-3.5 w-3.5"/>{total} vendors</span>
          </div>
        </div>
      </header>

      {/* Compliance Score Banner */}
      <div style={{backgroundColor:"var(--vc-primary-mid)",padding:"1rem 0"}}>
        <div style={{maxWidth:"80rem",margin:"0 auto",padding:"0 1.5rem"}}>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:"1rem"}}>
            <div>
              <p style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--vc-header-sub)",marginBottom:"0.25rem",margin:0}}>Portfolio Compliance Score</p>
              <div style={{display:"flex",alignItems:"flex-end",gap:"0.75rem"}}>
                <span style={{fontFamily:"var(--font-display)",fontSize:"2.75rem",fontWeight:700,lineHeight:1,color:"var(--vc-on-primary)"}}>{compScore}%</span>
                <span style={{fontSize:"0.875rem",color:"var(--vc-header-sub)",paddingBottom:"0.3rem"}}>{approved} of {total} approved</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"1.5rem"}}>
              {[
                {val:pending,  label:"Awaiting review", col:"var(--vc-accent)"},
                {val:docCount, label:"Documents",       col:"var(--vc-on-primary)"},
                {val:notifications.length, label:"Events", col:"var(--vc-on-primary)"},
              ].map(m=>(
                <div key={m.label} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.6rem",fontWeight:600,color:m.col,lineHeight:1}}>{m.val}</div>
                  <div style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--vc-header-sub)",marginTop:"0.25rem"}}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main style={{maxWidth:"80rem",margin:"0 auto",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.5rem"}}>

        {/* Forms */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:"1.5rem"}}>
          <section>
            <p style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--vc-text-muted)",marginBottom:"0.75rem"}}>Register Vendor</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",padding:"1.25rem"}}>
              <form onSubmit={onVendor} style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
                <div>
                  <Label htmlFor="vendor_email" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Vendor Email</Label>
                  <Input id="vendor_email" type="email" placeholder="vendor@company.com" value={vEmail} onChange={e=>setVEmail(e.target.value)} required className="mt-1 h-9 text-sm"/>
                </div>
                <div>
                  <Label htmlFor="company_name" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Company Name</Label>
                  <Input id="company_name" placeholder="Acme Supplies" value={vName} onChange={e=>setVName(e.target.value)} required className="mt-1 h-9 text-sm"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem"}}>
                  <div>
                    <Label htmlFor="category" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Category</Label>
                    <Input id="category" placeholder="Logistics…" value={vCat} onChange={e=>setVCat(e.target.value)} required className="mt-1 h-9 text-sm"/>
                  </div>
                  <div>
                    <Label htmlFor="risk_level" style={{color:"var(--vc-text-body)",fontSize:"0.8rem"}}>Risk Level</Label>
                    <select id="risk_level" value={vRisk} onChange={e=>setVRisk(e.target.value)}
                      style={{marginTop:"4px",width:"100%",borderRadius:"6px",border:"1px solid var(--vc-border)",padding:"0 0.75rem",height:"36px",fontSize:"0.875rem",backgroundColor:"var(--vc-surface-card)",color:"var(--vc-text-primary)"}}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={loading} style={{backgroundColor:"var(--vc-accent)",color:"var(--vc-on-accent)",height:"36px",fontSize:"0.875rem",fontWeight:600,width:"100%"}}>
                  <Plus className="h-3.5 w-3.5 mr-1.5"/>{loading?"Registering…":"Register Vendor"}
                </Button>
                {submitMsg && <p style={{fontSize:"0.75rem",color:submitMsg.includes("added")?"var(--vc-primary)":"var(--vc-accent-text)",margin:0}}>{submitMsg}</p>}
              </form>
            </Card>
          </section>

          <section>
            <p style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--vc-text-muted)",marginBottom:"0.75rem"}}>Record Document</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",padding:"1.25rem"}}>
              <form onSubmit={onDoc} style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
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
                <Button type="submit" style={{backgroundColor:"var(--vc-primary)",color:"var(--vc-on-primary)",height:"36px",fontSize:"0.875rem",fontWeight:600,width:"100%"}}>
                  <Upload className="h-3.5 w-3.5 mr-1.5"/>Save Document
                </Button>
                {docMsg && <p style={{fontSize:"0.75rem",color:docMsg.includes("saved")?"var(--vc-primary)":"var(--vc-accent-text)",margin:0}}>{docMsg}</p>}
              </form>
            </Card>
          </section>
        </div>

        {/* Admin Approval Queue */}
        <section aria-label="approval">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem"}}>
            <p style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--vc-text-muted)",margin:0}}>Admin Approval Queue</p>
            {actMsg && <span style={{fontSize:"0.75rem",fontWeight:600,color:"var(--vc-primary)"}}>{actMsg}</span>}
          </div>
          {vendors.length===0 && (
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)",padding:"2rem",textAlign:"center"}}>
              <AlertTriangle className="h-5 w-5" style={{color:"var(--vc-accent)",margin:"0 auto 0.5rem"}}/>
              <p style={{fontSize:"0.875rem",color:"var(--vc-text-faint)",margin:0}}>No vendors registered yet — use the form above.</p>
            </Card>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:"0.75rem"}}>
            {vendors.map(v=><VendorCard key={v.id} v={v}/>)}
          </div>
        </section>

        {/* Activity + Documents */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:"1.5rem"}}>
          <section aria-label="notification">
            <p style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--vc-text-muted)",marginBottom:"0.75rem"}}>Activity &amp; Notifications</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)"}}>
              {notifications.length===0 && (
                <div style={{padding:"2rem",textAlign:"center",fontSize:"0.875rem",color:"var(--vc-text-faint)"}}>No activity yet.</div>
              )}
              <ul style={{listStyle:"none",margin:0,padding:0}}>
                {notifications.slice(0,8).map((n,i)=>(
                  <li key={n.id} style={{display:"flex",alignItems:"flex-start",gap:"0.75rem",padding:"0.875rem 1.25rem",borderBottom:i<Math.min(notifications.length,8)-1?"1px solid var(--vc-border)":"none"}}>
                    <Bell className="h-3.5 w-3.5" style={{color:"var(--vc-accent)",marginTop:"2px",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:"0.875rem",color:"var(--vc-text-primary)",margin:0}}>{n.message}</p>
                      <p style={{fontSize:"0.72rem",color:"var(--vc-text-faint)",margin:0}}>{n.type} &middot; {new Date(n.createdAt??n.created_at??"").toLocaleString()}</p>
                    </div>
                    <span style={{...ST[n.status]??ORANGE,padding:"2px 6px",borderRadius:"4px",fontSize:"0.7rem",flexShrink:0}}>{n.status}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section>
            <p style={{fontSize:"0.625rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--vc-text-muted)",marginBottom:"0.75rem"}}>Documents on File</p>
            <Card style={{backgroundColor:"var(--vc-surface-card)",border:"1px solid var(--vc-border)"}}>
              {documents.length===0 && (
                <div style={{padding:"2rem",textAlign:"center",fontSize:"0.875rem",color:"var(--vc-text-faint)"}}>No documents yet.</div>
              )}
              <ul style={{listStyle:"none",margin:0,padding:0}}>
                {documents.slice(0,8).map((d,i)=>(
                  <li key={d.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1.25rem",borderBottom:i<Math.min(documents.length,8)-1?"1px solid var(--vc-border)":"none"}}>
                    <FileText className="h-4 w-4" style={{color:"var(--vc-accent)",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:"0.875rem",fontWeight:500,color:"var(--vc-text-primary)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.documentName??d.document_name}</p>
                      <p style={{fontSize:"0.72rem",color:"var(--vc-text-faint)",margin:0}}>{d.documentType??d.document_type} &middot; {(d.vendorId??d.vendor_id??"").slice(0,8)}…</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>

      </main>

      <footer style={{backgroundColor:"var(--vc-primary)",borderTop:"1px solid var(--vc-primary-mid)",padding:"1.25rem 1.5rem",marginTop:"1.5rem"}}>
        <div style={{maxWidth:"80rem",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <ShieldCheck className="h-4 w-4" style={{color:"var(--vc-accent)"}}/>
            <span style={{fontFamily:"var(--font-display)",fontSize:"0.95rem",fontWeight:600,color:"var(--vc-on-primary)"}}>VendorGuard</span>
          </div>
          <p style={{fontSize:"0.75rem",color:"var(--vc-header-sub)",margin:0}}>Keep your supply chain audit-ready</p>
        </div>
      </footer>
    </div>
  );
}
