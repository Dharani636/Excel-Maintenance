import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import * as XLSX from "xlsx";

interface Student {
  registerNumber: string;
  name: string;
  d: number;
  s: number;
  c: number;
  i: number;
  assignment: string;
}

type Subject = "d" | "i" | "s" | "c";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzfZrCfX46gJ1Dz03eUaVInkt8kIBwpBSWEelWc6ZL5eMo0ZldWr07mhIc1pueO-_iqmw/exec";

const emptyForm = {
  registerNumber: "",
  name: "",
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

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    fetchAll();
    loadTopics();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(API_URL);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const loadTopics = async () => {
    for (const type of ["d", "i", "s", "c"] as Subject[]) {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getAssignments", type }),
      });
      const json = await res.json();
      setTopics((p) => ({ ...p, [type]: json.assignments || [] }));
    }
  };

  /* ================= POST ================= */

  const post = async (payload: any) => {
    setLoading(true);
    setMessage("");

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
  };

  const downloadExcel = () => {
  if (!data.length) return;

  const excelData = data.map((s) => ({
    "Register Number": `${s.registerNumber}`,
    Name: s.name,
    D: s.d,
    I: s.i,
    S: s.s,
    C: s.c,
    Assignment: s.assignment || "",
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);

  ws["!cols"] = [
    { wch: 20 }, 
    { wch: 20 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 5 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  XLSX.writeFile(wb, "Student_Performance.xlsx");
};


  /* ================= STYLES ================= */

  const badge = (v: number) =>
    v < 25 ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-green-500/20 text-green-300 border border-green-500/30";

  const input =
    "w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-white/40 transition hover:border-white/40";

  return (
    <>
      <Navbar />

      <section className="pt-28 px-6 min-h-screen bg-linear-to-br from-[#0b0f14] via-[#0f172a] to-black text-white">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* TITLE */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">
              <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                🎓 Student Performance
              </span>
            </h1>
            <p className="text-white/60 text-lg">Manage and track student achievements with ease</p>
          </div>

          {/* MODE TABS */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { id: "create", label: "✨ Create Student" },
              { id: "updateScore", label: "📊 Update Score" },
              { id: "updateAssignment", label: "📝 Update Assignment" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMode(t.id as any);
                  setForm(emptyForm);
                }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className={input}
                placeholder="Register Number"
                value={form.registerNumber}
                onChange={(e) =>
                  setForm({ ...form, registerNumber: e.target.value })
                }
              />

              {mode === "create" && (
                <input
                  className={input}
                  placeholder="Student Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              )}
            </div>

            {mode !== "updateAssignment" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["d", "i", "s", "c"] as Subject[]).map((k) => (
                  <input
                    key={k}
                    className={input}
                    placeholder={k.toUpperCase()}
                    type="number"
                    value={form[k]}
                    onChange={(e) =>
                      setForm({ ...form, [k]: e.target.value })
                    }
                  />
                ))}
              </div>
            )}

            {mode === "updateAssignment" && (
              <input
                className={input}
                placeholder="Assignment"
                value={form.assignment}
                onChange={(e) =>
                  setForm({ ...form, assignment: e.target.value })
                }
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
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-cyan-300 font-semibold mt-2">Processing...</p>
            </div>
          )}

          {/* DOWNLOAD BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={downloadExcel}
              className="bg-linear-to-r from-green-500 to-emerald-500 text-white px-7 py-3 rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              ⬇ Download Excel
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/20 text-cyan-300 border-b border-white/20">
                    <tr>
                      {["Reg", "Name", "D", "I", "S", "C", "Assignment", "Action"].map(
                        (h) => (
                          <th key={h} className="px-4 py-4 text-left font-semibold">
                            {h}
                          </th>
                        )
                      )}
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
                        <td className="px-4 py-4 font-mono text-cyan-300">{s.registerNumber}</td>
                        <td className="px-4 py-4 font-semibold">{s.name}</td>

                        {(["d", "i", "s", "c"] as Subject[]).map((k) => (
                          <td key={k} className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(s[k])}`}>
                              {s[k]}
                            </span>
                          </td>
                        ))}

                        <td className="px-4 py-4 space-y-2">
                          <div className="text-cyan-400 text-xs">
                            {s.assignment || "—"}
                          </div>

                          <select
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 w-full text-xs hover:bg-white/20 transition cursor-pointer text-white"
                            onChange={(e) =>
                              post({
                                action: "updateAssignment",
                                registerNumber: s.registerNumber,
                                assignment: e.target.value,
                              })
                            }
                          >
                            <option style={{ backgroundColor: '#1e293b', color: '#fff' }}>Select...</option>
                            {s.d < 25 &&
                              topics.d.map((t, i) => (
                                <option key={i} value={`D - ${t}`} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                  D - {t}
                                </option>
                              ))}
                            {s.i < 25 &&
                              topics.i.map((t, i) => (
                                <option key={i} value={`I - ${t}`} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                  I - {t}
                                </option>
                              ))}
                            {s.s < 25 &&
                              topics.s.map((t, i) => (
                                <option key={i} value={`S - ${t}`} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                  S - {t}
                                </option>
                              ))}
                            {s.c < 25 &&
                              topics.c.map((t, i) => (
                                <option key={i} value={`C - ${t}`} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                  C - {t}
                                </option>
                              ))}
                          </select>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              post({
                                action: "delete",
                                registerNumber: s.registerNumber,
                              })
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
