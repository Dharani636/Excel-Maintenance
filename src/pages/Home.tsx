import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

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

  /* ================= STYLES ================= */

  const badge = (v: number) =>
    v < 25 ? "bg-red-500/30 text-red-400" : "bg-green-500/30 text-green-400";

  const input =
    "bg-black/40 border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none";

  return (
    <>
      <Navbar />

      <section className="pt-28 px-6 min-h-screen bg-linear-to-br from-[#0b0f14] via-[#0f172a] to-black text-white">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* TITLE */}
          <h1 className="text-3xl font-bold text-center text-cyan-400">
            🎓 Student Performance Dashboard
          </h1>

          {/* MODE TABS */}
          <div className="flex justify-center gap-4">
            {[
              { id: "create", label: "Create Student" },
              { id: "updateScore", label: "Update Score" },
              { id: "updateAssignment", label: "Update Assignment" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMode(t.id as any);
                  setForm(emptyForm);
                }}
                className={`px-5 py-2 rounded-full text-sm transition ${
                  mode === t.id
                    ? "bg-cyan-500 text-black"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              className={`max-w-3xl mx-auto text-center py-2 rounded-lg font-semibold ${
                messageType === "success"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* FORM */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-3xl mx-auto space-y-4">
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

            {mode !== "updateAssignment" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["d", "i", "s", "c"] as Subject[]).map((k) => (
                  <input
                    key={k}
                    className={input}
                    placeholder={k.toUpperCase()}
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
              className="w-full bg-cyan-500 text-black py-2 rounded-lg font-semibold hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit"}
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center text-cyan-300 font-semibold">
              Loading...
            </div>
          )}

          {/* TABLE */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-cyan-300">
                <tr>
                  {["Reg", "Name", "D", "I", "S", "C", "Assignment", "Action"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {data.map((s) => (
                  <tr
                    key={s.registerNumber}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">{s.registerNumber}</td>
                    <td className="px-4 py-3 font-semibold">{s.name}</td>

                    {(["d", "i", "s", "c"] as Subject[]).map((k) => (
                      <td key={k} className="px-4 py-3">
                        <span className={`px-2 py-1 rounded ${badge(s[k])}`}>
                          {s[k]}
                        </span>
                      </td>
                    ))}

                    <td className="px-4 py-3 space-y-2">
                      <div className="text-cyan-400">
                        {s.assignment || "No Assignment"}
                      </div>

                      <select
                        className="bg-black/40 border border-white/20 rounded px-2 py-1 w-full"
                        onChange={(e) =>
                          post({
                            action: "updateAssignment",
                            registerNumber: s.registerNumber,
                            assignment: e.target.value,
                          })
                        }
                      >
                        <option>Change Assignment</option>
                        {s.d < 25 &&
                          topics.d.map((t, i) => (
                            <option key={i} value={`D - ${t}`}>
                              D - {t}
                            </option>
                          ))}
                        {s.i < 25 &&
                          topics.i.map((t, i) => (
                            <option key={i} value={`I - ${t}`}>
                              I - {t}
                            </option>
                          ))}
                        {s.s < 25 &&
                          topics.s.map((t, i) => (
                            <option key={i} value={`S - ${t}`}>
                              S - {t}
                            </option>
                          ))}
                        {s.c < 25 &&
                          topics.c.map((t, i) => (
                            <option key={i} value={`C - ${t}`}>
                              C - {t}
                            </option>
                          ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          post({
                            action: "delete",
                            registerNumber: s.registerNumber,
                          })
                        }
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
