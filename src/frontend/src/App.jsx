import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import {
  Activity, CalendarDays, ClipboardList, LogOut, Search, ShieldCheck,
  Stethoscope, UserRound, Users, Building2, X, Clock, Star,
  CheckCircle2, AlertTriangle, Bot, ChevronRight, Send, Plus
} from "lucide-react";

const demoDoctors = [
  { id: 1, full_name: "Dr. Ananya Rao", specialization: "Cardiology", experience_years: 12, consultation_fee: 700, rating: 0, clinics: [{ id: 1, name: "MediCare Central", city: "Hyderabad" }] },
  { id: 2, full_name: "Dr. Rahul Mehta", specialization: "Dermatology", experience_years: 8, consultation_fee: 600, rating: 0, clinics: [{ id: 2, name: "CarePoint Clinic", city: "Secunderabad" }] },
  { id: 3, full_name: "Dr. Priya Nair", specialization: "General Medicine", experience_years: 10, consultation_fee: 500, rating: 0, clinics: [{ id: 1, name: "MediCare Central", city: "Hyderabad" }] }
];

function Login({ onLogin, onRegister }) {
  const [role, setRole] = useState("patient");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      if (data.user.role !== role) {
        setError(`This account is a ${data.user.role} account. Select ${data.user.role} login.`);
        return;
      }
      localStorage.setItem("medidesk_token", data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="brand-panel">
        <div className="brand"><Activity size={28} /> MediDesk</div>
        <div className="eyebrow">SECURE HEALTHCARE PLATFORM</div>
        <h1>Healthcare, secured around you.</h1>
        <p>Appointments, clinical information and security controls in one privacy-first workspace.</p>
        <div className="security-pill"><ShieldCheck size={17} /> RBAC â€¢ Object-level security â€¢ Audit-ready</div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="eyebrow">WELCOME BACK</div>
        <h2>Sign in to MediDesk</h2>

        <div className="role-tabs">
          {["patient", "doctor", "admin"].map((r) => (
            <button
              type="button"
              className={role === r ? "role-tab active" : "role-tab"}
              onClick={() => setRole(r)}
              key={r}
            >
              {r === "patient" ? "Patient" : r === "doctor" ? "Doctor" : "Admin"}
            </button>
          ))}
        </div>

        {error && <div className="error"><AlertTriangle size={16} />{error}</div>}

        <label>
          Username or email
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button className="primary full" disabled={busy}>
          {busy ? "Signing inâ€¦" : "Sign in"}
        </button>

        {role === "patient" && (
          <button type="button" className="link-btn" onClick={onRegister}>
            Create patient account
          </button>
        )}

        <p className="hint">
          {role === "patient"
            ? "Patients can self-register."
            : "This account is managed by the MediDesk administrator."}
        </p>
      </form>
    </div>
  );
}

function Register({ onBack }) {
  const [form, setForm] = useState({
    username: "", email: "", phone: "", password: "", full_name: ""
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm({ ...form, [key]: value });

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setError("");
    setBusy(true);

    try {
      await api.post("/auth/register", form);
      setMsg("Account created successfully. You can sign in now.");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Check that the backend is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell single">
      <form className="auth-card wide" onSubmit={submit}>
        <div className="eyebrow">PATIENT REGISTRATION</div>
        <h2>Create your MediDesk account</h2>

        {msg && <div className="success"><CheckCircle2 size={16} />{msg}</div>}
        {error && <div className="error"><AlertTriangle size={16} />{error}</div>}

        <div className="grid2">
          <label>Full name<input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required /></label>
          <label>Username<input value={form.username} onChange={(e) => set("username", e.target.value)} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></label>
          <label>Phone<input value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></label>
          <label>Password<input type="password" minLength="8" value={form.password} onChange={(e) => set("password", e.target.value)} required /></label>
        </div>

        <button className="primary full" disabled={busy}>
          {busy ? "Creating accountâ€¦" : "Create account"}
        </button>
        <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
      </form>
    </div>
  );
}

function Layout({ user, onLogout, page, setPage, children }) {
  const items = user.role === "patient"
    ? [
        ["dashboard", "Dashboard", Activity],
        ["doctors", "Find Doctors", Search],
        ["appointments", "My Appointments", CalendarDays],
        ["reports", "My Reports", ClipboardList],
        ["assistant", "AI Assistant", Bot],
        ["profile", "Profile", UserRound]
      ]
    : user.role === "doctor"
    ? [
        ["dashboard", "Dashboard", Activity],
        ["appointments", "Appointments", CalendarDays],
        ["patients", "Patients", Users],
        ["reports", "Reports", ClipboardList],
        ["availability", "Availability", Clock],
        ["profile", "Profile", UserRound]
      ]
    : [
        ["dashboard", "Dashboard", Activity],
        ["doctors", "Doctors", Stethoscope],
        ["patients", "Patients", Users],
        ["clinics", "Clinics", Building2],
        ["appointments", "Appointments", CalendarDays],
        ["security", "Security Monitor", ShieldCheck]
      ];

  return (
    <div className="app-shell">
      <aside>
        <div className="brand"><Activity size={25} /> MediDesk</div>
        <div className="role-chip"><ShieldCheck size={15} />{user.role.toUpperCase()}</div>

        <nav>
          {items.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "nav-item active" : "nav-item"}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>

        <button className="logout" onClick={onLogout}>
          <LogOut size={17} />Sign out
        </button>
      </aside>

      <main>{children}</main>
    </div>
  );
}

function Header({ eyebrow, title, sub, user }) {
  return (
    <header>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="muted">{sub}</p>
      </div>
      <div className="avatar">
        {user?.role === "doctor"
          ? <Stethoscope size={19} />
          : user?.role === "admin"
          ? <ShieldCheck size={19} />
          : <UserRound size={19} />}
      </div>
    </header>
  );
}

function Stat({ icon: Icon, label, value, onClick }) {
  return (
    <button className="stat" onClick={onClick}>
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function DoctorCard({ doctor, onBook }) {
  return (
    <div className="doctor-card">
      <div className="doctor-avatar"><Stethoscope /></div>
      <div className="doctor-main">
        <div className="card-top">
          <div>
            <h3>{doctor.full_name}</h3>
            <p className="speciality">{doctor.specialization}</p>
          </div>
          <span className="rating">
            <Star size={14} fill="currentColor" />{doctor.rating || "New"}
          </span>
        </div>

        <p className="clinic">
          {doctor.clinics?.map((c) => c.name).join(" â€¢ ") || "MediDesk Clinic"}
        </p>

        <div className="doctor-meta">
          <span>{doctor.experience_years} yrs exp</span>
          <span>â‚¹{doctor.consultation_fee}</span>
        </div>

        <button className="primary small" onClick={() => onBook(doctor)}>
          Book appointment
        </button>
      </div>
    </div>
  );
}

function PatientHome({ user, setPage, onBook }) {
  const [doctors, setDoctors] = useState(demoDoctors);

  useEffect(() => {
    api.get("/doctors")
      .then((r) => setDoctors(r.data))
      .catch(() => {});
  }, []);

  return (
    <>
      <Header
        eyebrow="PATIENT DASHBOARD"
        title={`Good to see you, ${user.username}`}
        sub="Find a doctor and manage your care in one place."
        user={user}
      />

      <div className="stat-grid">
        <Stat icon={CalendarDays} label="Upcoming" value="View" onClick={() => setPage("appointments")} />
        <Stat icon={ClipboardList} label="Reports" value="View" onClick={() => setPage("reports")} />
        <Stat icon={Stethoscope} label="Doctors" value={doctors.length} />
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Find Doctors</h2>
            <p className="muted">Choose a doctor, clinic and appointment slot.</p>
          </div>
          <button className="secondary" onClick={() => setPage("doctors")}>
            View all <ChevronRight size={16} />
          </button>
        </div>

        <div className="doctor-grid">
          {doctors.slice(0, 3).map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={onBook} />
          ))}
        </div>
      </section>
    </>
  );
}

function Doctors({ onBook }) {
  const [doctors, setDoctors] = useState(demoDoctors);
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [maxFee, setMaxFee] = useState("");

  async function load() {
    try {
      const params = {};
      if (q) params.q = q;
      if (spec) params.specialization = spec;
      if (maxFee) params.max_fee = maxFee;

      const r = await api.get("/doctors", { params });
      setDoctors(r.data);
    } catch {
      // Keep demo data visible if the API temporarily fails.
    }
  }

  useEffect(() => {
    load();
  }, [spec, maxFee]);

  const filtered = useMemo(
    () =>
      doctors.filter((d) =>
        (d.full_name + " " + d.specialization + " " +
          (d.clinics || []).map((c) => c.name).join(" "))
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [doctors, q]
  );

  return (
    <>
      <Header
        eyebrow="FIND DOCTORS"
        title="Find the right doctor"
        sub="Search by doctor, specialization or clinic."
        user={{ role: "patient" }}
      />

      <div className="filters">
        <div className="search grow">
          <Search size={17} />
          <input
            placeholder="Search doctor or clinicâ€¦"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select value={spec} onChange={(e) => setSpec(e.target.value)}>
          <option value="">All specializations</option>
          <option>Cardiology</option>
          <option>Dermatology</option>
          <option>General Medicine</option>
          <option>Neurology</option>
          <option>Orthopedics</option>
          <option>Pediatrics</option>
          <option>ENT</option>
          <option>Ophthalmology</option>
          <option>Gynecology</option>
        </select>

        <select value={maxFee} onChange={(e) => setMaxFee(e.target.value)}>
          <option value="">Any fee</option>
          <option value="500">â‰¤ â‚¹500</option>
          <option value="600">â‰¤ â‚¹600</option>
          <option value="700">â‰¤ â‚¹700</option>
          <option value="1000">â‰¤ â‚¹1000</option>
        </select>

        <button className="secondary" onClick={load}>Search</button>
      </div>

      <div className="doctor-grid">
        {filtered.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} onBook={onBook} />
        ))}
      </div>
    </>
  );
}

function BookingModal({ doctor, onClose }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [clinic, setClinic] = useState(doctor.clinics?.[0]?.id || "");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const slots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

  function isWeekend(value) {
    if (!value) return false;
    const day = new Date(`${value}T00:00:00`).getDay();
    return day === 0 || day === 6;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");

    if (!date) {
      setError("Please choose an appointment date.");
      setBusy(false);
      return;
    }

    if (isWeekend(date)) {
      setError("Doctor availability is Monday to Friday. Please choose a weekday.");
      setBusy(false);
      return;
    }

    try {
      await api.post("/appointments", {
        doctor_id: Number(doctor.id),
        clinic_id: Number(clinic),
        date,
        time,
        reason
      });

      setMsg("Appointment booked successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not book appointment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}>
          <X />
        </button>

        <div className="eyebrow">BOOK APPOINTMENT</div>
        <h2>{doctor.full_name}</h2>
        <p className="muted">{doctor.specialization} â€¢ â‚¹{doctor.consultation_fee}</p>

        {msg ? (
          <>
            <div className="success"><CheckCircle2 size={16} />{msg}</div>
            <button type="button" className="primary full" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            {error && <div className="error"><AlertTriangle size={16} />{error}</div>}

            <label>
              Clinic
              <select value={clinic} onChange={(e) => setClinic(e.target.value)} required>
                {doctor.clinics?.map((c) => (
                  <option value={c.id} key={c.id}>{c.name} â€” {c.city}</option>
                ))}
              </select>
            </label>

            <div className="grid2">
              <label>
                Date
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>

              <label>
                Time
                <select value={time} onChange={(e) => setTime(e.target.value)}>
                  {slots.map((slot) => <option key={slot}>{slot}</option>)}
                </select>
              </label>
            </div>

            <label>
              Reason for visit
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional"
              />
            </label>

            <button className="primary full" disabled={busy}>
              {busy ? "Bookingâ€¦" : "Confirm appointment"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

function Appointments({ role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const endpoint = role === "doctor" ? "/appointments/doctor" : "/appointments/mine";
      const r = await api.get(endpoint);
      setItems(r.data);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [role]);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Action failed.");
    }
  }

  async function cancelPatientAppointment(id) {
    try {
      await api.patch(`/appointments/${id}/status`, { status: "cancelled" });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Cancellation failed.");
    }
  }

  return (
    <>
      <Header
        eyebrow={role === "doctor" ? "CLINICAL WORKSPACE" : "MY APPOINTMENTS"}
        title={role === "doctor" ? "Appointments" : "My appointments"}
        sub="Live appointment data from MediDesk."
        user={{ role }}
      />

      {error && <div className="error"><AlertTriangle size={16} />{error}</div>}

      {loading ? (
        <div className="panel">Loading appointmentsâ€¦</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <CalendarDays size={30} />
          <h3>No appointments yet</h3>
          <p className="muted">
            {role === "doctor"
              ? "Booked appointments will appear here."
              : "Book a doctor to see your appointments here."}
          </p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>{role === "doctor" ? "Patient" : "Doctor"}</th>
                <th>Clinic</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{role === "doctor" ? a.patient?.name : a.doctor?.name}</td>
                  <td>{a.clinic?.name}</td>
                  <td><span className={"badge " + a.status}>{a.status}</span></td>

                  <td>
                    <div className="actions">
                      {role === "doctor" && a.status === "pending" && (
                        <button className="tiny success-btn" onClick={() => updateStatus(a.id, "confirmed")}>
                          Confirm
                        </button>
                      )}

                      {role === "doctor" && a.status === "confirmed" && (
                        <button className="tiny" onClick={() => updateStatus(a.id, "completed")}>
                          Complete
                        </button>
                      )}

                      {a.status !== "completed" && a.status !== "cancelled" && (
                        <button
                          className="tiny danger-btn"
                          onClick={() =>
                            role === "doctor"
                              ? updateStatus(a.id, "cancelled")
                              : cancelPatientAppointment(a.id)
                          }
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(q = question) {
    const text = q.trim();
    if (!text) return;

    setQuestion(text);
    setAnswer("");
    setLoading(true);

    try {
      const doctorsResponse = await api.get("/doctors");
      const doctors = doctorsResponse.data || [];
      const lower = text.toLowerCase();

      if (
        lower.includes("doctor") ||
        lower.includes("special") ||
        lower.includes("cardio") ||
        lower.includes("derma") ||
        lower.includes("medicine") ||
        lower.includes("clinic")
      ) {
        let results = doctors;

        if (lower.includes("cardio")) {
          results = doctors.filter((d) => d.specialization.toLowerCase().includes("cardio"));
        } else if (lower.includes("derma")) {
          results = doctors.filter((d) => d.specialization.toLowerCase().includes("derma"));
        } else if (lower.includes("medicine")) {
          results = doctors.filter((d) => d.specialization.toLowerCase().includes("medicine"));
        }

        if (results.length) {
          setAnswer(
            "I found these doctors in MediDesk:\n\n" +
            results.map((d) =>
              `• ${d.full_name}\n  Specialization: ${d.specialization}\n  Consultation fee: Rs. ${d.consultation_fee}\n  Clinic: ${
                d.clinics?.map((c) => c.name).join(", ") || "Clinic unavailable"
              }`
            ).join("\n\n")
          );
        } else {
          setAnswer("I couldn't find a matching doctor in the MediDesk database.");
        }
      } else if (
        lower.includes("appointment") ||
        lower.includes("book") ||
        lower.includes("schedule")
      ) {
        setAnswer(
          "Open Find Doctors, select a doctor, choose a clinic, weekday, time and reason, then click Confirm Appointment."
        );
      } else if (lower.includes("report") || lower.includes("medical")) {
        setAnswer(
          "Your medical reports are available through My Reports. Access is protected using role-based and object-level authorization."
        );
      } else {
        setAnswer(
          "I can help with doctors, clinics, consultation fees, appointments and reports. Try: â€œShow cardiologistsâ€ or â€œHow do I book an appointment?â€"
        );
      }
    } catch {
      setAnswer("I couldn't connect to the MediDesk database. Make sure Flask is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header
        eyebrow="MEDIDESK AI"
        title="AI Assistant"
        sub="Ask about doctors, clinics and appointment workflows."
        user={{ role: "patient" }}
      />

      <div className="ai-box">
        <div className="ai-icon"><Bot size={28} /></div>
        <h2>MediDesk Assistant</h2>

        <p className="muted">
          I can help you find doctors, check clinic availability, and manage
          your MediDesk appointments using live platform data. I do not provide
          medical diagnosis or treatment advice.
        </p>

        <div className="ai-input">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask: Show cardiologistsâ€¦"
          />
          <button className="primary" onClick={() => ask()} disabled={loading}>
            {loading ? "Thinkingâ€¦" : "Ask"} <Send size={15} />
          </button>
        </div>

        <div className="quick-questions">
          <button className="secondary" onClick={() => ask("Show cardiologists")}>Show cardiologists</button>
          <button className="secondary" onClick={() => ask("Show available doctors")}>Available doctors</button>
          <button className="secondary" onClick={() => ask("How do I book an appointment?")}>How do I book?</button>
        </div>

        {answer && (
          <div className="ai-answer">
            <h3>Assistant</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </>
  );
}


function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await api.get("/doctors/me/patients");
        setPatients(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Unable to load authorized patients.");
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  return (
    <>
      <Header
        eyebrow="CLINICAL WORKSPACE"
        title="Authorized Patients"
        sub="Patients connected to your appointments."
        user={{ role: "doctor" }}
      />

      {loading && <div className="panel">Loading authorized patients...</div>}

      {error && (
        <div className="error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="empty">
          <Users size={30} />
          <h3>No patients yet</h3>
          <p className="muted">
            Patients connected to your appointments will appear here.
          </p>
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Appointment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td><strong>{patient.full_name}</strong></td>
                  <td>{patient.email || "—"}</td>
                  <td>{patient.phone || "—"}</td>
                  <td>
                    {patient.appointment_date} {patient.appointment_time}
                  </td>
                  <td>
                    <span className={"badge " + patient.appointment_status}>
                      {patient.appointment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const emptyForm = {
    username: "",
    email: "",
    phone: "",
    password: "",
    full_name: "",
    specialization: "",
    experience_years: "",
    consultation_fee: "",
    bio: ""
  };

  const [form, setForm] = useState(emptyForm);

  async function loadDoctors() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/doctors");
      setDoctors(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load doctors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function addDoctor(e) {
    e.preventDefault();

    try {
      await api.post("/admin/doctors", {
        ...form,
        experience_years: Number(form.experience_years || 0),
        consultation_fee: Number(form.consultation_fee || 0)
      });

      setForm(emptyForm);
      setShowForm(false);
      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to create doctor.");
    }
  }

  async function toggleDoctor(doctor) {
    try {
      await api.patch(`/admin/doctors/${doctor.id}/status`, {
        is_active: !doctor.is_active
      });

      await loadDoctors();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update doctor status.");
    }
  }

  return (
    <div className="page-stack">
      <Header
        eyebrow="ADMIN CONSOLE"
        title="Doctor Management"
        sub="Provision and manage MediDesk doctors. Public doctor signup is disabled."
        user={{ role: "admin" }}
      />

      {error && (
        <div className="error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="section-head">
        <div>
          <h2>Registered Doctors</h2>
          <p className="muted">
            Manage doctor accounts and access status.
          </p>
        </div>

        <button
          className="primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close Form" : "+ Add Doctor"}
        </button>
      </div>

      {showForm && (
        <form className="panel" onSubmit={addDoctor}>
          <div className="eyebrow">NEW DOCTOR</div>
          <h2>Add Doctor</h2>

          <div className="grid2">
            <label>
              Full name
              <input
                name="full_name"
                value={form.full_name}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Specialization
              <input
                name="specialization"
                value={form.specialization}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Username
              <input
                name="username"
                value={form.username}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Temporary password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Experience (years)
              <input
                name="experience_years"
                type="number"
                min="0"
                value={form.experience_years}
                onChange={updateField}
              />
            </label>

            <label>
              Consultation fee
              <input
                name="consultation_fee"
                type="number"
                min="0"
                value={form.consultation_fee}
                onChange={updateField}
              />
            </label>
          </div>

          <label>
            Bio
            <textarea
              name="bio"
              value={form.bio}
              onChange={updateField}
              rows="3"
            />
          </label>

          <button className="primary" type="submit">
            Create Doctor
          </button>
        </form>
      )}

      <div className="panel">
        {loading ? (
          <p className="muted">Loading doctors...</p>
        ) : doctors.length === 0 ? (
          <div className="empty">
            <Stethoscope size={30} />
            <h3>No doctors found</h3>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Fee</th>
                  <th>Clinic</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <strong>{doctor.full_name}</strong>
                      <div className="muted">
                        {doctor.email || doctor.username}
                      </div>
                    </td>

                    <td>{doctor.specialization}</td>
                    <td>{doctor.experience_years} yrs</td>
                    <td>₹{doctor.consultation_fee}</td>

                    <td>
                      {doctor.clinics?.length
                        ? doctor.clinics.map((c) => c.name).join(", ")
                        : "Not assigned"}
                    </td>

                    <td>
                      <span className={"badge " + (doctor.is_active ? "confirmed" : "cancelled")}>
                        {doctor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="tiny"
                        onClick={() => toggleDoctor(doctor)}
                      >
                        {doctor.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPatients() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/patients");
      setPatients(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function togglePatient(patient) {
    try {
      await api.patch(`/admin/patients/${patient.id}/status`, {
        is_active: !patient.is_active
      });

      await loadPatients();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update patient status.");
    }
  }

  return (
    <>
      <Header
        eyebrow="ADMIN CONSOLE"
        title="Patient Management"
        sub="Review registered patient accounts and account status."
        user={{ role: "admin" }}
      />

      {error && (
        <div className="error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="panel">
        {loading ? (
          <p className="muted">Loading patients...</p>
        ) : patients.length === 0 ? (
          <div className="empty">
            <Users size={30} />
            <h3>No patients found</h3>
            <p className="muted">
              Registered patient accounts will appear here.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <strong>{patient.full_name}</strong>
                    </td>

                    <td>{patient.username || "—"}</td>
                    <td>{patient.email || "—"}</td>
                    <td>{patient.phone || "—"}</td>

                    <td>
                      <span
                        className={
                          "badge " +
                          (patient.is_active ? "confirmed" : "cancelled")
                        }
                      >
                        {patient.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="tiny"
                        onClick={() => togglePatient(patient)}
                      >
                        {patient.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
function AdminClinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  async function loadClinics() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/clinics");
      setClinics(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load clinics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClinics();
  }, []);

  async function createClinic(e) {
    e.preventDefault();

    try {
      setError("");

      await api.post("/admin/clinics", {
        name,
        address,
        city
      });

      setName("");
      setAddress("");
      setCity("");
      setShowForm(false);

      await loadClinics();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to create clinic.");
    }
  }

  return (
    <>
      <Header
        eyebrow="ADMIN CONSOLE"
        title="Clinic Management"
        sub="Manage registered clinics across MediDesk."
        user={{ role: "admin" }}
      />

      {error && (
        <div className="error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Registered Clinics</h3>
            <p className="muted">
              View clinics and add new clinic locations.
            </p>
          </div>

          <button
            className="primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} />
            Add Clinic
          </button>
        </div>

        {showForm && (
          <form className="form-grid" onSubmit={createClinic}>
            <div className="field">
              <label>Clinic Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter clinic name"
                required
              />
            </div>

            <div className="field">
              <label>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter clinic address"
              />
            </div>

            <div className="field">
              <label>City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
              />
            </div>

            <div>
              <button className="primary" type="submit">
                Create Clinic
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="muted">Loading clinics...</p>
        ) : clinics.length === 0 ? (
          <div className="empty">
            <Building2 size={30} />
            <h3>No clinics found</h3>
            <p className="muted">
              Add your first clinic to get started.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Clinic</th>
                  <th>Address</th>
                  <th>City</th>
                </tr>
              </thead>

              <tbody>
                {clinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td>
                      <strong>{clinic.name}</strong>
                    </td>
                    <td>{clinic.address || "—"}</td>
                    <td>{clinic.city || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/appointments");
      setAppointments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  return (
    <>
      <Header
        eyebrow="ADMIN CONSOLE"
        title="Appointment Management"
        sub="Review appointment activity across MediDesk."
        user={{ role: "admin" }}
      />

      {error && (
        <div className="error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="panel">
        {loading ? (
          <p className="muted">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <div className="empty">
            <CalendarDays size={30} />
            <h3>No appointments found</h3>
            <p className="muted">
              Patient bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Clinic</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <strong>{appointment.patient || "—"}</strong>
                    </td>
                    <td>{appointment.doctor || "—"}</td>
                    <td>{appointment.clinic || "—"}</td>
                    <td>{appointment.date || "—"}</td>
                    <td>{appointment.time || "—"}</td>
                    <td>{appointment.reason || "—"}</td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (appointment.status === "confirmed"
                            ? "confirmed"
                            : appointment.status === "cancelled"
                            ? "cancelled"
                            : "")
                        }
                      >
                        {appointment.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
function SimplePanel({ title, text, icon: Icon = ClipboardList }) {
  return (
    <div className="panel">
      <Icon size={30} />
      <h2>{title}</h2>
      <p className="muted">{text}</p>
    </div>
  );
}

function DoctorHome({ user }) {
  return (
    <>
      <Header
        eyebrow="DOCTOR DASHBOARD"
        title="Clinical workspace"
        sub={`Welcome, ${user.username}. Manage appointments and authorized patient context.`}
        user={user}
      />

      <div className="stat-grid">
        <Stat icon={CalendarDays} label="Appointments" value="View" />
        <Stat icon={Users} label="Patients" value="Secure" />
        <Stat icon={ClipboardList} label="Reports" value="Protected" />
      </div>

      <div className="panel security-panel">
        <ShieldCheck />
        <div>
          <h2>Patient privacy protected</h2>
          <p className="muted">
            Object-level authorization ensures doctors only access records connected to their appointments.
          </p>
        </div>
      </div>
    </>
  );
}

function AdminHome({ user }) {
  return (
    <>
      <Header
        eyebrow="ADMIN CONSOLE"
        title="System overview"
        sub="Manage MediDesk operations and monitor security events."
        user={user}
      />

      <div className="stat-grid">
        <Stat icon={Users} label="Patients" value="Manage" />
        <Stat icon={Stethoscope} label="Doctors" value="Manage" />
        <Stat icon={CalendarDays} label="Appointments" value="Live" />
        <Stat icon={ShieldCheck} label="Security" value="Monitor" />
      </div>

      <div className="panel security-panel">
        <ShieldCheck />
        <div>
          <h2>Security Monitor</h2>
          <p className="muted">
            Audit logs and object-level authorization alerts are available to the administrator.
          </p>
        </div>
        <span className="security-pill">Protected</span>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [register, setRegister] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("medidesk_token");

    if (token) {
      api.get("/auth/me")
        .then((r) => setUser(r.data))
        .catch(() => {
          localStorage.removeItem("medidesk_token");
          setUser(null);
        });
    }
  }, []);

  function logout() {
    localStorage.removeItem("medidesk_token");
    setUser(null);
    setPage("dashboard");
  }

  if (!user) {
    return register
      ? <Register onBack={() => setRegister(false)} />
      : <Login onLogin={setUser} onRegister={() => setRegister(true)} />;
  }

  let content;

  if (user.role === "patient") {
    if (page === "dashboard") {
      content = (
        <PatientHome
          user={user}
          setPage={setPage}
          onBook={setBooking}
        />
      );
    } else if (page === "doctors") {
      content = <Doctors onBook={setBooking} />;
    } else if (page === "appointments") {
      content = <Appointments role="patient" />;
    } else if (page === "reports") {
      content = (
        <SimplePanel
          title="My Reports"
          text="Medical reports linked to your appointments will appear here. Access is restricted to you and authorized clinicians."
        />
      );
    } else if (page === "assistant") {
      content = <AIAssistant />;
    } else {
      content = (
        <SimplePanel
          title="Profile"
          text={`Signed in as ${user.username}. Email: ${user.email}.`}
          icon={UserRound}
        />
      );
    }
  } else if (user.role === "doctor") {
    if (page === "dashboard") {
      content = <DoctorHome user={user} />;
    } else if (page === "appointments") {
      content = <Appointments role="doctor" />;
    } else if (page === "patients") {
      content = <DoctorPatients />;
    } else if (page === "reports") {
      content = (
        <SimplePanel
          title="Patient Reports"
          text="Only reports belonging to patients with appointments assigned to you should be accessible."
        />
      );
    } else if (page === "availability") {
      content = (
        <SimplePanel
          title="Availability"
          text="Use your secure doctor availability API to manage clinic working hours and slots."
          icon={Clock}
        />
      );
    } else {
      content = (
        <SimplePanel
          title="Doctor Profile"
          text={`Signed in as ${user.username}.`}
          icon={UserRound}
        />
      );
    }
  } else {
    if (page === "dashboard") {
      content = <AdminHome user={user} />;
    } else if (page === "security") {
      content = (
        <SimplePanel
          title="Security Monitor"
          text="Monitor audit events and unauthorized access alerts. This is the key security demonstration area."
          icon={ShieldCheck}
        />
      );
    } else if (page === "doctors") {
      content = <AdminDoctors />;
    } else if (page === "patients") {
      content = <AdminPatients />;
    } else if (page === "clinics") {
      content = <AdminClinics />;
    } else {
      content = <AdminAppointments />;
    }
  }

  return (
    <>
      <Layout
        user={user}
        onLogout={logout}
        page={page}
        setPage={setPage}
      >
        {content}
      </Layout>

      {booking && (
        <BookingModal
          doctor={booking}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}










