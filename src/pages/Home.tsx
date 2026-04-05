import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";

interface Student {
  registerNumber: string;
  name: string;
  specialization: string;
  jobPreferred: string;
  d: number;
  i: number;
  s: number;
  c: number;
  assignment: string;
  status: string;
}

type Subject = "d" | "i" | "s" | "c";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxyJeUPy3BMKmoKBulgjclaeF4W0DZTuFckMVKryMxld0fb_qUAjZcBHXZhz-9FeAFhrA/exec";

const emptyForm = {
  registerNumber: "",
  name: "",
  specialization: "",
  jobPreferred: "",
  d: "",
  i: "",
  s: "",
  c: "",
  assignment: "",
};

const SEM_LABELS: Record<number, string> = {
  1: "Semester I",
  2: "Semester II",
  3: "Semester III",
  4: "Semester IV",
  5: "Semester V",
  6: "Semester VI",
  7: "Semester VII",
  8: "Semester VIII",
};

const Home = () => {
  const [activeSem, setActiveSem]   = useState<number>(1);
  const [availableSems, setAvailableSems] = useState<number[]>([1]);
  const [showCreateSem, setShowCreateSem] = useState(false);
  const [newSemNum, setNewSemNum]   = useState("");

  const [data, setData]   = useState<Student[]>([]);
  const [mode, setMode]   = useState<"create" | "updateScore" | "updateAssignment">("create");
  const [form, setForm]   = useState<any>(emptyForm);

  const [topics, setTopics] = useState<Record<Subject, string[]>>({
    d: [], i: [], s: [], c: [],
  });
  const [specializationOptions, setSpecializationOptions] = useState<string[]>([]);
  const [jobOptions, setJobOptions]   = useState<string[]>([]);

  const [loading, setLoading]         = useState(false);
  const [semCreating, setSemCreating] = useState(false);
  const [message, setMessage]         = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  /* ─── INIT ─── */
  useEffect(() => {
    loadAvailableSems();
    loadTopics();
    loadDropdowns();
  }, []);

  useEffect(() => {
    fetchAll();
  }, [activeSem]);

  /* ─── AVAILABLE SEMS ─── */
  const loadAvailableSems = async () => {
    try {
      const res  = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getAvailableSems" }),
      });
      const json = await res.json();
      if (Array.isArray(json.semesters) && json.semesters.length > 0) {
        setAvailableSems(json.semesters);
        setActiveSem(json.semesters[0]);
      }
    } catch {}
  };

  /* ─── FETCH STUDENTS ─── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}?sem=${activeSem}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  /* ─── TOPIC LISTS ─── */
  const loadTopics = async () => {
    for (const type of ["d", "i", "s", "c"] as Subject[]) {
      try {
        const res  = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getAssignments", type }),
        });
        const json = await res.json();
        setTopics(p => ({ ...p, [type]: json.assignments || [] }));
      } catch {}
    }
  };

  /* ─── DROPDOWNS ─── */
  const loadDropdowns = async () => {
    try {
      const [specRes, jobRes] = await Promise.all([
        fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getDropdowns", type: "specialization" }) }),
        fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getDropdowns", type: "jobPreferred" }) }),
      ]);
      const specJson = await specRes.json();
      const jobJson  = await jobRes.json();
      setSpecializationOptions(specJson.options || []);
      setJobOptions(jobJson.options || []);
    } catch {}
  };

  /* ─── GENERIC POST (always passes sem) ─── */
  const post = async (payload: any) => {
    setLoading(true);
    setMessage("");
    try {
      const res  = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ ...payload, sem: activeSem }),
      });
      const json = await res.json();
      setLoading(false);

      if (json?.error) {
        setMessageType("error");
        setMessage(json.message || "Something went wrong");
        return;
      }

      setMessageType("success");
      setMessage("Operation successful");
      fetchAll();
      setForm(emptyForm);
      setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
    } catch {
      setLoading(false);
      setMessageType("error");
      setMessage("Network error. Please try again.");
    }
  };

  /* ─── CREATE SEMESTER ─── */
  const handleCreateSemester = async () => {
    const num = parseInt(newSemNum);
    if (!num || num < 1 || num > 8) {
      setMessageType("error");
      setMessage("Enter a valid semester number (1–8)");
      setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
      return;
    }
    if (availableSems.includes(num)) {
      setMessageType("error");
      setMessage(`Semester ${num} already exists`);
      setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
      return;
    }

    setSemCreating(true);
    try {
      const res  = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "createSemester", sem: num }),
      });
      const json = await res.json();

      if (json?.error) {
        setMessageType("error");
        setMessage(json.message || "Failed to create semester");
      } else {
        setMessageType("success");
        setMessage(`${SEM_LABELS[num] || "Semester " + num} created successfully!`);
        const updated = [...availableSems, num].sort((a, b) => a - b);
        setAvailableSems(updated);
        setActiveSem(num);
        setShowCreateSem(false);
        setNewSemNum("");
      }
      setTimeout(() => { setMessage(""); setMessageType(""); }, 3000);
    } catch {
      setMessageType("error");
      setMessage("Network error");
    }
    setSemCreating(false);
  };

  /* ─── TOGGLE STATUS ─── */
  const toggleStatus = async (student: Student) => {
    const newStatus = student.status === "Submitted" ? "Not Submitted" : "Submitted";
    setData(prev =>
      prev.map(s => s.registerNumber === student.registerNumber ? { ...s, status: newStatus } : s)
    );
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateStatus", registerNumber: student.registerNumber, status: newStatus, sem: activeSem }),
    });
  };

  /* ─── EXCEL DOWNLOAD ─── */
  const downloadExcel = () => {
    if (!data.length) return;
    const excelData = data.map(s => ({
      "Register Number": String(s.registerNumber),
      Name:              s.name,
      Specialization:    s.specialization || "",
      "Job Preferred":   s.jobPreferred || "",
      D: s.d, I: s.i, S: s.s, C: s.c,
      Assignment: s.assignment || "",
      Status:     s.status || "Not Submitted",
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      {wch:20},{wch:22},{wch:22},{wch:22},
      {wch:6},{wch:6},{wch:6},{wch:6},{wch:35},{wch:15},
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, SEM_LABELS[activeSem] || "Semester");
    XLSX.writeFile(wb, `Student_Performance_Sem${activeSem}.xlsx`);
  };

  /* ─── STYLES ─── */
  const scoreBadge = (v: number) =>
    v < 25
      ? "bg-red-500/20 text-red-300 border border-red-500/40"
      : "bg-green-500/20 text-green-300 border border-green-500/40";

  const inputCls  = "w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-white/40 transition hover:border-white/40";
  const selectCls = "w-full border border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white transition hover:border-white/40 cursor-pointer";

  /* ─── RENDER ─── */
  return (
    <>
      <Navbar />

      <section className="pt-28 px-4 min-h-screen bg-linear-to-br from-[#0b0f14] via-[#0f172a] to-black text-white">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* TITLE */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                🎓 Student Performance
              </span>
            </h1>
            <p className="text-white/60 text-lg">Manage and track student achievements with ease</p>
          </div>

          {/* ══════════ SEMESTER BAR ══════════ */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 flex flex-wrap items-center gap-3 justify-between shadow-xl">

            {/* Left — sem switcher label + dropdown */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-white/60 text-sm font-semibold uppercase tracking-widest">
                📚 Semester
              </span>

              {/* Semester dropdown */}
              <select
                value={activeSem}
                onChange={e => { setActiveSem(Number(e.target.value)); setForm(emptyForm); }}
                className="bg-[#1e293b] border border-cyan-500/40 text-cyan-300 font-bold rounded-xl px-5 py-2.5 text-sm cursor-pointer focus:ring-2 focus:ring-cyan-500 outline-none hover:border-cyan-400 transition"
              >
                {availableSems.map(sem => (
                  <option key={sem} value={sem} style={{ backgroundColor: "#1e293b", color: "#22d3ee" }}>
                    {SEM_LABELS[sem] || "Semester " + sem}
                  </option>
                ))}
              </select>

              {/* Sem pill badges */}
              <div className="flex gap-2 flex-wrap">
                {availableSems.map(sem => (
                  <button
                    key={sem}
                    onClick={() => { setActiveSem(sem); setForm(emptyForm); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                      activeSem === sem
                        ? "bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30"
                        : "bg-white/5 text-white/60 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Create Semester button */}
            <div className="flex items-center gap-3">
              {showCreateSem ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newSemNum}
                    onChange={e => setNewSemNum(e.target.value)}
                    className="bg-[#1e293b] border border-white/30 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">Select Sem</option>
                    {[1,2,3,4,5,6,7,8]
                      .filter(n => !availableSems.includes(n))
                      .map(n => (
                        <option key={n} value={n} style={{ backgroundColor: "#1e293b" }}>
                          {SEM_LABELS[n] || "Semester " + n}
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={semCreating || !newSemNum}
                    onClick={handleCreateSemester}
                    className="bg-linear-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-400 hover:to-indigo-400 disabled:opacity-50 transition"
                  >
                    {semCreating ? "⏳ Creating..." : "✓ Create"}
                  </button>
                  <button
                    onClick={() => { setShowCreateSem(false); setNewSemNum(""); }}
                    className="text-white/40 hover:text-white/70 px-2 py-2 text-sm transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateSem(true)}
                  className="bg-linear-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-purple-400 hover:to-indigo-400 transition transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  ＋ New Semester
                </button>
              )}
            </div>
          </div>

          {/* Active semester label */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-cyan-400 font-bold text-lg tracking-wide">
              📖 {SEM_LABELS[activeSem] || "Semester " + activeSem}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* MODE TABS */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { id: "create",           label: "✨ Create Student" },
              { id: "updateScore",      label: "📊 Update Score" },
              { id: "updateAssignment", label: "📝 Update Assignment" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setMode(t.id as any); setForm(emptyForm); }}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition transform ${
                  mode === t.id
                    ? "bg-linear-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105"
                    : "bg-white/10 hover:bg-white/20 text-white/80 border border-white/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* MESSAGE */}
          {message && (
            <div className={`max-w-3xl mx-auto text-center py-3 rounded-xl font-semibold border ${
              messageType === "success"
                ? "bg-green-500/15 text-green-300 border-green-500/30"
                : "bg-red-500/15 text-red-300 border-red-500/30"
            }`}>
              {messageType === "success" ? "✅" : "❌"} {message}
            </div>
          )}

          {/* FORM */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-3xl mx-auto space-y-5 shadow-2xl">

            {/* Reg + Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className={inputCls}
                placeholder="Register Number"
                value={form.registerNumber}
                onChange={e => setForm({ ...form, registerNumber: e.target.value })}
              />
              {mode === "create" && (
                <input
                  className={inputCls}
                  placeholder="Student Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              )}
            </div>

            {/* Specialization + Job Preferred */}
            {mode === "create" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className={selectCls}
                  value={form.specialization}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}
                  style={{ backgroundColor: "#1e293b" }}
                >
                  <option value="">— Select Specialization —</option>
                  {specializationOptions.map((opt, i) => (
                    <option key={i} value={opt} style={{ backgroundColor: "#1e293b", color: "#fff" }}>{opt}</option>
                  ))}
                </select>

                <select
                  className={selectCls}
                  value={form.jobPreferred}
                  onChange={e => setForm({ ...form, jobPreferred: e.target.value })}
                  style={{ backgroundColor: "#1e293b" }}
                >
                  <option value="">— Select Job Preferred —</option>
                  {jobOptions.map((opt, i) => (
                    <option key={i} value={opt} style={{ backgroundColor: "#1e293b", color: "#fff" }}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* D / I / S / C */}
            {mode !== "updateAssignment" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["d", "i", "s", "c"] as Subject[]).map(k => (
                  <input
                    key={k}
                    className={inputCls}
                    placeholder={k.toUpperCase()}
                    type="number"
                    value={form[k]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                  />
                ))}
              </div>
            )}

            {/* Assignment text */}
            {mode === "updateAssignment" && (
              <input
                className={inputCls}
                placeholder="Assignment"
                value={form.assignment}
                onChange={e => setForm({ ...form, assignment: e.target.value })}
              />
            )}

            <button
              disabled={loading}
              onClick={() => post({ action: mode, ...form })}
              className="w-full bg-linear-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 shadow-lg"
            >
              {loading ? "⏳ Processing..." : "✓ Submit"}
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-cyan-300 font-semibold mt-2">Processing...</p>
            </div>
          )}

          {/* DOWNLOAD */}
          <div className="flex justify-end">
            <button
              onClick={downloadExcel}
              className="bg-linear-to-r from-green-500 to-emerald-500 text-white px-7 py-3 rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              ⬇ Download Excel — {SEM_LABELS[activeSem] || "Sem " + activeSem}
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl mb-12">
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/20 text-cyan-300 border-b border-white/20">
                    <tr>
                      {["Reg No","Name","Specialization","Job Preferred","D","I","S","C","Assignment","Status","Action"].map(h => (
                        <th key={h} className="px-4 py-4 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((s, idx) => (
                      <tr
                        key={s.registerNumber}
                        className={`border-t border-white/10 transition ${idx % 2 === 0 ? "bg-white/5" : "bg-transparent"} hover:bg-white/10`}
                      >
                        {/* Reg */}
                        <td className="px-4 py-4 font-mono text-cyan-300 whitespace-nowrap">{s.registerNumber}</td>
                        {/* Name */}
                        <td className="px-4 py-4 font-semibold whitespace-nowrap">{s.name}</td>
                        {/* Specialization */}
                        <td className="px-4 py-4 text-white/70 whitespace-nowrap">{s.specialization || "—"}</td>
                        {/* Job Preferred */}
                        <td className="px-4 py-4 text-white/70 whitespace-nowrap">{s.jobPreferred || "—"}</td>
                        {/* D */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.d))}`}>{s.d}</span>
                        </td>
                        {/* I */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.i))}`}>{s.i}</span>
                        </td>
                        {/* S */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.s))}`}>{s.s}</span>
                        </td>
                        {/* C */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.c))}`}>{s.c}</span>
                        </td>
                        {/* Assignment */}
                        <td className="px-4 py-4 min-w-[180px] space-y-2">
                          <div className="text-cyan-400 text-xs leading-snug">{s.assignment || "—"}</div>
                          <select
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 w-full text-xs hover:bg-white/20 transition cursor-pointer text-white"
                            defaultValue=""
                            onChange={e => {
                              if (!e.target.value) return;
                              post({ action: "updateAssignment", registerNumber: s.registerNumber, assignment: e.target.value });
                              e.target.value = "";
                            }}
                          >
                            <option value="" style={{ backgroundColor: "#1e293b", color: "#fff" }}>Select...</option>
                            {Number(s.d) < 25 && topics.d.map((t, i) => (
                              <option key={i} value={`D - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>D - {t}</option>
                            ))}
                            {Number(s.i) < 25 && topics.i.map((t, i) => (
                              <option key={i} value={`I - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>I - {t}</option>
                            ))}
                            {Number(s.s) < 25 && topics.s.map((t, i) => (
                              <option key={i} value={`S - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>S - {t}</option>
                            ))}
                            {Number(s.c) < 25 && topics.c.map((t, i) => (
                              <option key={i} value={`C - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>C - {t}</option>
                            ))}
                          </select>
                        </td>
                        {/* Status toggle */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition transform hover:scale-105 ${
                              s.status === "Submitted"
                                ? "bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30"
                                : "bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30"
                            }`}
                          >
                            {s.status === "Submitted" ? "✅ Submitted" : "⏳ Not Submitted"}
                          </button>
                        </td>
                        {/* Delete */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => post({ action: "delete", registerNumber: s.registerNumber })}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1 rounded transition font-medium text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/40 text-4xl mb-3">📭</p>
                <p className="text-white/60 text-lg">
                  No students in {SEM_LABELS[activeSem] || "Semester " + activeSem} yet.
                </p>
                <p className="text-white/40 text-sm mt-1">Use the Create Student form above to add one.</p>
              </div>
            )}
          </div>

        </div>
      </section>
    </>
  );
};

export default Home;