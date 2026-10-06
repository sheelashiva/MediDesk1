import React, { useEffect, useState } from "react";
import api from "./api";
import {
  Activity, CalendarDays, ClipboardList, LogOut, Search,
  ShieldCheck, Stethoscope, UserRound, Users, Building2
} from "lucide-react";

const demoDoctors = [
  { id: 1, full_name: "Dr. Ananya Rao", specialization: "Cardiology", experience_years: 12, consultation_fee: 700, rating: 4.8, clinics: [{name:"MediCare Central", city:"Hyderabad"}] },
  { id: 2, full_name: "Dr. Rahul Mehta", specialization: "Dermatology", experience_years: 8, consultation_fee: 600, rating: 4.6, clinics: [{name:"CarePoint Clinic", city:"Secunderabad"}] },
  { id: 3, full_name: "Dr. Priya Nair", specialization: "General Medicine", experience_years: 10, consultation_fee: 500, rating: 4.9, clinics: [{name:"MediCare Central", city:"Hyderabad"}] }
];

function Login({ onLogin, onRegister }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      const {data} = await api.post("/auth/login", {identifier, password});
      localStorage.setItem("medidesk_token", data.access_token);
      onLogin(data.user);
    } catch (err) { setError(err.response?.data?.error || "Login failed"); }
  }

  return <div className="auth-shell">
    <div className="brand-panel">
      <div className="brand"><Activity size={28}/> MediDesk</div>
      <h1>Healthcare, secured around you.</h1>
      <p>Secure clinic and appointment management with role-based access and privacy-first workflows.</p>
      <div className="security-pill"><ShieldCheck size={17}/> Security by design</div>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div className="eyebrow">WELCOME BACK</div>
      <h2>Sign in to MediDesk</h2>
      <p className="muted">Use your username or email.</p>
      {error && <div className="error">{error}</div>}
      <label>Username or email<input value={identifier} onChange={e=>setIdentifier(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      <button className="primary full">Sign in</button>
      <button type="button" className="link-btn" onClick={onRegister}>Create patient account</button>
    </form>
  </div>
}

function Register({ onBack }) {
  const [form, setForm] = useState({username:"",email:"",phone:"",password:"",full_name:""});
  const [message, setMessage] = useState(""); const [error,setError]=useState("");
  const set = (k,v)=>setForm({...form,[k]:v});
  async function submit(e) {
    e.preventDefault(); setError(""); setMessage("");
    try { await api.post("/auth/register",form); setMessage("Account created. You can sign in now."); }
    catch(err){setError(err.response?.data?.error||"Registration failed");}
  }
  return <div className="auth-shell single">
    <form className="auth-card wide" onSubmit={submit}>
      <div className="eyebrow">PATIENT REGISTRATION</div><h2>Create your MediDesk account</h2>
      {message&&<div className="success">{message}</div>}{error&&<div className="error">{error}</div>}
      <div className="grid2">
        <label>Full name<input value={form.full_name} onChange={e=>set("full_name",e.target.value)} required/></label>
        <label>Username<input value={form.username} onChange={e=>set("username",e.target.value)} required/></label>
        <label>Email<input type="email" value={form.email} onChange={e=>set("email",e.target.value)} required/></label>
        <label>Phone<input value={form.phone} onChange={e=>set("phone",e.target.value)} required/></label>
        <label>Password<input type="password" value={form.password} onChange={e=>set("password",e.target.value)} minLength="8" required/></label>
      </div>
      <button className="primary">Create account</button>
      <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
    </form>
  </div>
}

function Layout({user,onLogout,children}) {
  const role = user?.role || "patient";
  return <div className="app-shell">
    <aside>
      <div className="brand"><Activity size={25}/> MediDesk</div>
      <div className="role-chip"><ShieldCheck size={15}/>{role.toUpperCase()}</div>
      <nav>
        <div className="nav-item active"><Activity size={18}/>Dashboard</div>
        <div className="nav-item"><CalendarDays size={18}/>Appointments</div>
        {role==="patient" && <div className="nav-item"><Search size={18}/>Find Doctors</div>}
        {role==="patient" && <div className="nav-item"><ClipboardList size={18}/>My Reports</div>}
        {role==="doctor" && <div className="nav-item"><Users size={18}/>Patients</div>}
        {role==="admin" && <div className="nav-item"><Stethoscope size={18}/>Doctors</div>}
        {role==="admin" && <div className="nav-item"><Building2 size={18}/>Clinics</div>}
        {role==="admin" && <div className="nav-item"><ShieldCheck size={18}/>Security Monitor</div>}
      </nav>
      <button className="logout" onClick={onLogout}><LogOut size={17}/>Sign out</button>
    </aside>
    <main>{children}</main>
  </div>
}

function PatientDashboard() {
  const [doctors,setDoctors]=useState(demoDoctors); const [q,setQ]=useState("");
  useEffect(()=>{api.get("/doctors").then(r=>setDoctors(r.data)).catch(()=>{});},[]);
  const filtered=doctors.filter(d=>(d.full_name+" "+d.specialization).toLowerCase().includes(q.toLowerCase()));
  return <><header><div><div className="eyebrow">PATIENT DASHBOARD</div><h1>Good to see you</h1><p className="muted">Find a doctor and manage your care in one place.</p></div><div className="avatar"><UserRound size={19}/></div></header>
    <section className="stat-grid"><div className="stat"><CalendarDays/><span>Upcoming</span><strong>0</strong></div><div className="stat"><ClipboardList/><span>Reports</span><strong>0</strong></div><div className="stat"><Stethoscope/><span>Doctors</span><strong>{doctors.length}</strong></div></section>
    <section className="section"><div className="section-head"><div><h2>Find Doctors</h2><p className="muted">Search by doctor or specialization.</p></div><div className="search"><Search size={17}/><input placeholder="Search doctors..." value={q} onChange={e=>setQ(e.target.value)}/></div></div>
      <div className="doctor-grid">{filtered.map(d=><div className="doctor-card" key={d.id}><div className="doctor-avatar"><Stethoscope/></div><div className="doctor-main"><h3>{d.full_name}</h3><p className="speciality">{d.specialization}</p><p className="clinic">{d.clinics?.[0]?.name || "MediDesk Clinic"}</p><div className="doctor-meta"><span>★ {d.rating||0}</span><span>{d.experience_years} yrs</span><span>₹{d.consultation_fee}</span></div><button className="primary small">Book appointment</button></div></div>)}</div>
    </section>
  </>
}

function DoctorDashboard() {
  return <><header><div><div className="eyebrow">DOCTOR DASHBOARD</div><h1>Clinical workspace</h1><p className="muted">Appointments, patient context and availability.</p></div><div className="avatar"><Stethoscope size={19}/></div></header>
    <section className="stat-grid"><div className="stat"><CalendarDays/><span>Appointments</span><strong>0</strong></div><div className="stat"><Users/><span>Patients</span><strong>0</strong></div><div className="stat"><ClipboardList/><span>Reports</span><strong>0</strong></div></section>
    <div className="panel"><h2>Today's appointments</h2><p className="muted">No appointments yet. Once patients book, authorized patient information will appear here.</p></div>
  </>
}

function AdminDashboard() {
  return <><header><div><div className="eyebrow">ADMIN CONSOLE</div><h1>System overview</h1><p className="muted">Manage doctors, clinics and security events.</p></div><div className="avatar"><ShieldCheck size={19}/></div></header>
    <section className="stat-grid"><div className="stat"><Users/><span>Patients</span><strong>—</strong></div><div className="stat"><Stethoscope/><span>Doctors</span><strong>—</strong></div><div className="stat"><CalendarDays/><span>Appointments</span><strong>—</strong></div><div className="stat"><ShieldCheck/><span>Open alerts</span><strong>—</strong></div></section>
    <div className="panel security-panel"><div><h2>Security Monitor</h2><p className="muted">Audit logs and object-level authorization alerts are available through the secure admin API.</p></div><div className="security-pill"><ShieldCheck size={16}/> Protected</div></div>
  </>
}

export default function App(){
  const [user,setUser]=useState(null); const [register,setRegister]=useState(false);
  useEffect(()=>{const token=localStorage.getItem("medidesk_token"); if(token) api.get("/auth/me").then(r=>setUser(r.data)).catch(()=>localStorage.removeItem("medidesk_token"));},[]);
  function logout(){localStorage.removeItem("medidesk_token");setUser(null);}
  if(!user) return register?<Register onBack={()=>setRegister(false)}/>:<Login onLogin={setUser} onRegister={()=>setRegister(true)}/>;
  return <Layout user={user} onLogout={logout}>{user.role==="patient"?<PatientDashboard/>:user.role==="doctor"?<DoctorDashboard/>:<AdminDashboard/>}</Layout>
}
