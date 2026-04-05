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
  "https://script.google.com/macros/s/AKfycbyKuINjoAiXCw2peTRFlHGdcUJtNitAHkcESMcx9oP7JuNGD3pcbC5o2yZwiV0aSItp9A/exec";

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

const Home = () => {
  const [data, setData] = useState<Student[]>([]);
  const [mode, setMode] =
    useState<"create" | "updateScore" | "updateAssignment">("create");

  const [form, setForm] = useState<any>(emptyForm);

  const [topics, setTopics] = useState<Record<Subject, string[]>>({
    d: [],
    i: [],
    s: [],
    c: [],
  });

  const [specializationOptions, setSpecializationOptions] = useState<string[]>([]);
  const [jobOptions, setJobOptions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  /* ================= LOAD ================= */

  useEffect(() => {
    fetchAll();
    loadTopics();
    loadDropdowns();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  const loadTopics = async () => {
    for (const type of ["d", "i", "s", "c"] as Subject[]) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getAssignments", type }),
        });
        const json = await res.json();
        setTopics((p) => ({ ...p, [type]: json.assignments || [] }));
      } catch {}
    }
  };

  const loadDropdowns = async () => {
    try {
      const [specRes, jobRes] = await Promise.all([
        fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getDropdowns", type: "specialization" }),
        }),
        fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "getDropdowns", type: "jobPreferred" }),
        }),
      ]);
      const specJson = await specRes.json();
      const jobJson = await jobRes.json();
      setSpecializationOptions(specJson.options || []);
      setJobOptions(jobJson.options || []);
    } catch {}
  };

  /* ================= POST ================= */

  const post = async (payload: any) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
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

      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);
    } catch {
      setLoading(false);
      setMessageType("error");
      setMessage("Network error. Please try again.");
    }
  };

  /* ================= TOGGLE STATUS ================= */

  const toggleStatus = async (student: Student) => {
    const newStatus =
      student.status === "Submitted" ? "Not Submitted" : "Submitted";

    // Optimistic update
    setData((prev) =>
      prev.map((s) =>
        s.registerNumber === student.registerNumber
          ? { ...s, status: newStatus }
          : s
      )
    );

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateStatus",
        registerNumber: student.registerNumber,
        status: newStatus,
      }),
    });
  };

  /* ================= EXCEL ================= */

  const downloadExcel = () => {
    if (!data.length) return;

    const excelData = data.map((s) => ({
      "Register Number": String(s.registerNumber),
      Name:              s.name,
      Specialization:    s.specialization || "",
      "Job Preferred":   s.jobPreferred || "",
      D:                 s.d,
      I:                 s.i,
      S:                 s.s,
      C:                 s.c,
      Assignment:        s.assignment || "",
      Status:            s.status || "Not Submitted",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
      { wch: 6 },  { wch: 6 },  { wch: 6 },  { wch: 6 },
      { wch: 35 }, { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Performance.xlsx");
  };

  /* ================= STYLES ================= */

  const scoreBadge = (v: number) =>
    v < 25
      ? "bg-red-500/20 text-red-300 border border-red-500/40"
      : "bg-green-500/20 text-green-300 border border-green-500/40";

  const inputCls =
    "w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-white/40 transition hover:border-white/40";

  const selectCls =
    "w-full border border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white transition hover:border-white/40 cursor-pointer";

  /* ================= RENDER ================= */

  return (
    <>
      <Navbar />

      <section className="pt-28 px-4 min-h-screen bg-linear-to-br from-[#0b0f14] via-[#0f172a] to-black text-white">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* TITLE */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                🎓 Student Performance
              </span>
            </h1>
            <p className="text-white/60 text-lg">Manage and track student achievements with ease</p>
          </div>

          {/* MODE TABS */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { id: "create",           label: "✨ Create Student" },
              { id: "updateScore",      label: "📊 Update Score" },
              { id: "updateAssignment", label: "📝 Update Assignment" },
            ].map((t) => (
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
            <div
              className={`max-w-3xl mx-auto text-center py-3 rounded-xl font-semibold border ${
                messageType === "success"
                  ? "bg-green-500/15 text-green-300 border-green-500/30"
                  : "bg-red-500/15 text-red-300 border-red-500/30"
              }`}
            >
              {messageType === "success" ? "✅" : "❌"} {message}
            </div>
          )}

          {/* FORM */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-3xl mx-auto space-y-5 shadow-2xl">

            {/* Register Number + Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className={inputCls}
                placeholder="Register Number"
                value={form.registerNumber}
                onChange={(e) => setForm({ ...form, registerNumber: e.target.value })}
              />
              {mode === "create" && (
                <input
                  className={inputCls}
                  placeholder="Student Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
            </div>

            {/* Specialization + Job Preferred — Create only */}
            {mode === "create" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className={selectCls}
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  style={{ backgroundColor: "#1e293b" }}
                >
                  <option value="">— Select Specialization —</option>
                  {specializationOptions.map((opt, i) => (
                    <option key={i} value={opt} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  className={selectCls}
                  value={form.jobPreferred}
                  onChange={(e) => setForm({ ...form, jobPreferred: e.target.value })}
                  style={{ backgroundColor: "#1e293b" }}
                >
                  <option value="">— Select Job Preferred —</option>
                  {jobOptions.map((opt, i) => (
                    <option key={i} value={opt} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* D / I / S / C scores */}
            {mode !== "updateAssignment" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["d", "i", "s", "c"] as Subject[]).map((k) => (
                  <input
                    key={k}
                    className={inputCls}
                    placeholder={k.toUpperCase()}
                    type="number"
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                ))}
              </div>
            )}

            {/* Assignment text — updateAssignment mode only */}
            {mode === "updateAssignment" && (
              <input
                className={inputCls}
                placeholder="Assignment"
                value={form.assignment}
                onChange={(e) => setForm({ ...form, assignment: e.target.value })}
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

          {/* LOADING SPINNER */}
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
              ⬇ Download Excel
            </button>
          </div>

          {/* TABLE — columns match sheet exactly:
              Reg | Name | Specialization | Job Preferred | D | I | S | C | Assignment | Status | Action */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl mb-12">
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/20 text-cyan-300 border-b border-white/20">
                    <tr>
                      {[
                        "Reg No",
                        "Name",
                        "Specialization",
                        "Job Preferred",
                        "D",
                        "I",
                        "S",
                        "C",
                        "Assignment",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th key={h} className="px-4 py-4 text-left font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((s, idx) => (
                      <tr
                        key={s.registerNumber}
                        className={`border-t border-white/10 transition ${
                          idx % 2 === 0 ? "bg-white/5" : "bg-transparent"
                        } hover:bg-white/10`}
                      >
                        {/* A — Register Number */}
                        <td className="px-4 py-4 font-mono text-cyan-300 whitespace-nowrap">
                          {s.registerNumber}
                        </td>

                        {/* B — Name */}
                        <td className="px-4 py-4 font-semibold whitespace-nowrap">
                          {s.name}
                        </td>

                        {/* C — Specialization */}
                        <td className="px-4 py-4 text-white/70 whitespace-nowrap">
                          {s.specialization || "—"}
                        </td>

                        {/* D — Job Preferred */}
                        <td className="px-4 py-4 text-white/70 whitespace-nowrap">
                          {s.jobPreferred || "—"}
                        </td>

                        {/* E — D score */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.d))}`}>
                            {s.d}
                          </span>
                        </td>

                        {/* F — I score */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.i))}`}>
                            {s.i}
                          </span>
                        </td>

                        {/* G — S score */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.s))}`}>
                            {s.s}
                          </span>
                        </td>

                        {/* H — C score */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadge(Number(s.c))}`}>
                            {s.c}
                          </span>
                        </td>

                        {/* I — Assignment */}
                        <td className="px-4 py-4 min-w-[180px] space-y-2">
                          <div className="text-cyan-400 text-xs leading-snug">
                            {s.assignment || "—"}
                          </div>
                          <select
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 w-full text-xs hover:bg-white/20 transition cursor-pointer text-white"
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              post({
                                action: "updateAssignment",
                                registerNumber: s.registerNumber,
                                assignment: e.target.value,
                              });
                              e.target.value = "";
                            }}
                          >
                            <option value="" style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                              Select...
                            </option>
                            {Number(s.d) < 25 && topics.d.map((t, i) => (
                              <option key={i} value={`D - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                                D - {t}
                              </option>
                            ))}
                            {Number(s.i) < 25 && topics.i.map((t, i) => (
                              <option key={i} value={`I - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                                I - {t}
                              </option>
                            ))}
                            {Number(s.s) < 25 && topics.s.map((t, i) => (
                              <option key={i} value={`S - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                                S - {t}
                              </option>
                            ))}
                            {Number(s.c) < 25 && topics.c.map((t, i) => (
                              <option key={i} value={`C - ${t}`} style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                                C - {t}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* J — Status toggle */}
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

                        {/* Action — Delete */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              post({ action: "delete", registerNumber: s.registerNumber })
                            }
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
                <p className="text-white/60 text-lg">No students yet. Create one to get started!</p>
              </div>
            )}
          </div>

        </div>
      </section>
    </>
  );
};

export default Home;