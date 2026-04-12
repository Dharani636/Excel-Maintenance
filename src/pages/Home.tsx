import { useEffect, useRef, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
Chart.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale);

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxyJeUPy3BMKmoKBulgjclaeF4W0DZTuFckMVKryMxld0fb_qUAjZcBHXZhz-9FeAFhrA/exec";

const DISC_COLORS = ["#dc2626", "#ef4444", "#f87171", "#fca5a5"];
const DISC_LABELS = ["D – Dominance", "I – Influence", "S – Steadiness", "C – Conscientiousness"];

const SEM_LABELS: Record<number, string> = {
  1: "Semester I", 2: "Semester II", 3: "Semester III", 4: "Semester IV",
  5: "Semester V", 6: "Semester VI", 7: "Semester VII", 8: "Semester VIII",
};

const emptyForm = {
  registerNumber: "", name: "", specialization: "", jobPreferred: "",
  d: "", i: "", s: "", c: "", assignment: "",
};

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */

interface Student {
  registerNumber: string; name: string; specialization: string;
  jobPreferred: string; d: number; i: number; s: number; c: number;
  assignment: string; status: string;
}

type Subject = "d" | "i" | "s" | "c";
type Mode = "create" | "updateScore" | "updateAssignment";
type AppView = "login" | "dashboard";

/* ═══════════════════════════════════════════════════
   LOGIN SCREEN
═══════════════════════════════════════════════════ */

const LoginScreen = ({
  onLogin,
}: {
  onLogin: (role: "admin" | "viewer") => void;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [viewerMode, setViewerMode] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "adminLogin", username: username.trim(), password: password.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        onLogin("admin");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.loginBg}>
      {/* Decorative grid */}
      <div style={styles.gridOverlay} />

      <div style={styles.loginCard}>
        {/* Logo / Brand */}
        <div style={styles.loginBrand}>
          <div style={styles.brandIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="2" fill="white" />
              <rect x="15" y="2" width="11" height="11" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="2" y="15" width="11" height="11" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="15" y="15" width="11" height="11" rx="2" fill="white" fillOpacity="0.25" />
            </svg>
          </div>
          <div>
            <div style={styles.brandTitle}>DISC Portal</div>
            <div style={styles.brandSub}>Student Performance Management</div>
          </div>
        </div>

        {!viewerMode ? (
          <>
            <h2 style={styles.loginHeading}>Admin Sign In</h2>
            <p style={styles.loginDesc}>Enter your credentials to access the admin dashboard</p>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Username</label>
              <input
                style={styles.loginInput}
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...styles.loginInput, paddingRight: "48px" }}
                  type={showPass ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button
                  style={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                  type="button"
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && <div style={styles.loginError}>{error}</div>}

            <button
              style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In as Admin"}
            </button>

            <div style={styles.divider}><span style={styles.dividerText}>or</span></div>

            <button
              style={styles.viewerBtn}
              onClick={() => onLogin("viewer")}
            >
              Continue as Viewer (Read Only)
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   DISC PIE CHART COMPONENT
═══════════════════════════════════════════════════ */

const DiscPieChart = ({ student, label }: { student: Student | null; label: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if (!student) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["D", "I", "S", "C"],
        datasets: [{
          data: [Number(student.d), Number(student.i), Number(student.s), Number(student.c)],
          backgroundColor: DISC_COLORS,
          borderWidth: 2,
          borderColor: "#fff",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } },
        },
        cutout: "50%",
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [student]);

  const isSem1 = label.includes("I") && !label.includes("II") && !label.includes("III");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <span style={{
        fontSize: "11px", fontWeight: 600, padding: "3px 12px",
        borderRadius: "20px", letterSpacing: "0.04em",
        background: isSem1 ? "#dc2626" : "#1e3a5f",
        color: "#fff",
      }}>
        {label}
      </span>
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        {student ? (
          <canvas ref={canvasRef} role="img" aria-label={`DISC chart ${label}`} />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#999", fontSize: "11px",
            border: "1px dashed #ddd", borderRadius: "50%",
          }}>No data</div>
        )}
      </div>
      {student && (
        <div style={{ fontSize: "10px", color: "#888", textAlign: "center", lineHeight: 1.6 }}>
          D:{student.d} · I:{student.i} · S:{student.s} · C:{student.c}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SPECIALIZATION IMPROVEMENT MODAL
═══════════════════════════════════════════════════ */

interface SpecImprovementData {
  spec: string;
  total: number;
  improved: number;
  notImproved: number;
  noData: number;
  improvePct: number;
  avgSem1: number;
  avgSem2: number;
  avgDelta: number;
}

function computeImprovementData(sem1Data: Student[], sem2Data: Student[]): SpecImprovementData[] {
  const sem2Map = Object.fromEntries(sem2Data.map(s => [String(s.registerNumber), s]));
  const allSpecs = [...new Set([...sem1Data, ...sem2Data].map(s => s.specialization).filter(Boolean))];

  return allSpecs.map(spec => {
    const s1Students = sem1Data.filter(s => s.specialization === spec);
    const total = s1Students.length;
    let improved = 0, notImproved = 0, noData = 0, sumSem1 = 0, sumSem2 = 0, countBoth = 0;

    s1Students.forEach(s1 => {
      const avg1 = (Number(s1.d) + Number(s1.i) + Number(s1.s) + Number(s1.c)) / 4;
      sumSem1 += avg1;
      const s2 = sem2Map[String(s1.registerNumber)];
      if (!s2) { noData++; return; }
      const avg2 = (Number(s2.d) + Number(s2.i) + Number(s2.s) + Number(s2.c)) / 4;
      sumSem2 += avg2;
      countBoth++;
      if (avg2 > avg1) improved++; else notImproved++;
    });

    const avgSem1 = total > 0 ? sumSem1 / total : 0;
    const avgSem2 = countBoth > 0 ? sumSem2 / countBoth : 0;
    const improvePct = countBoth > 0 ? (improved / countBoth) * 100 : 0;

    return {
      spec, total, improved, notImproved, noData,
      improvePct,
      avgSem1: parseFloat(avgSem1.toFixed(1)),
      avgSem2: parseFloat(avgSem2.toFixed(1)),
      avgDelta: parseFloat((avgSem2 - avgSem1).toFixed(1)),
    };
  }).sort((a, b) => b.total - a.total);
}

const SpecImprovementModal = ({
  onClose, sem1Data, sem2Data,
}: {
  onClose: () => void;
  sem1Data: Student[];
  sem2Data: Student[];
}) => {
  const barRef = useRef<HTMLCanvasElement>(null);
  const barChart = useRef<any>(null);
  const deltaRef = useRef<HTMLCanvasElement>(null);
  const deltaChart = useRef<any>(null);

  const data = computeImprovementData(sem1Data, sem2Data);
  const labels = data.map(d => d.spec);

  useEffect(() => {
    if (!barRef.current || !data.length) return;
    if (barChart.current) barChart.current.destroy();
    barChart.current = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Improved", data: data.map(d => d.improved), backgroundColor: "#16a34a", borderRadius: 6 },
          { label: "Not Improved", data: data.map(d => d.notImproved), backgroundColor: "#dc2626", borderRadius: 6 },
          { label: "No Sem II Data", data: data.map(d => d.noData), backgroundColor: "#d1d5db", borderRadius: 6 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterBody: (items: any) => { const d2 = data[items[0].dataIndex]; return [`Total: ${d2.total}`, `Rate: ${d2.improvePct.toFixed(0)}%`]; } } },
        },
        scales: { x: { stacked: true, ticks: { font: { size: 11 } } }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
    return () => { if (barChart.current) barChart.current.destroy(); };
  }, [sem1Data, sem2Data]);

  useEffect(() => {
    if (!deltaRef.current || !data.length) return;
    if (deltaChart.current) deltaChart.current.destroy();
    deltaChart.current = new Chart(deltaRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Avg DISC Δ (Sem II − Sem I)",
          data: data.map(d => d.avgDelta),
          backgroundColor: data.map(d => d.avgDelta >= 0 ? "#16a34a" : "#dc2626"),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 11 } } },
          y: { beginAtZero: false, ticks: { callback: (v: any) => (v > 0 ? "+" : "") + v } },
        },
      },
    });
    return () => { if (deltaChart.current) deltaChart.current.destroy(); };
  }, [sem1Data, sem2Data]);

  return (
    <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.analysisModal, maxWidth: "1020px" }}>

        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Specialization Improvement Report</h2>
            <p style={styles.modalSub}>Semester I → Semester II · Average DISC score improvement per specialization</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: "12px", marginBottom: "28px" }}>
          {data.map(d => (
            <div key={d.spec} style={{ border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "14px 16px", borderTop: `4px solid ${d.improvePct >= 50 ? "#16a34a" : "#dc2626"}` }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#111", marginBottom: "6px", lineHeight: 1.3 }}>{d.spec}</div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: d.improvePct >= 50 ? "#16a34a" : "#dc2626" }}>{d.improvePct.toFixed(0)}%</div>
              <div style={{ fontSize: "10px", color: "#888", marginTop: "1px" }}>improvement rate</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "11px" }}>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ {d.improved}</span>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ {d.notImproved}</span>
                <span style={{ color: "#888" }}>{d.total} total</span>
              </div>
              <div style={{ marginTop: "6px", fontSize: "10px", color: "#888" }}>
                Avg {d.avgSem1} → {d.avgSem2}
                <span style={{ marginLeft: "6px", fontWeight: 700, color: d.avgDelta >= 0 ? "#16a34a" : "#dc2626" }}>
                  ({d.avgDelta >= 0 ? "+" : ""}{d.avgDelta})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
          {[["#16a34a","Improved"],["#dc2626","Not Improved"],["#d1d5db","No Sem II Data"]].map(([color, lbl]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#555" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />{lbl}
            </div>
          ))}
        </div>

        {/* Chart 1 */}
        <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Students Improved vs Not Improved</div>
        <div style={{ position: "relative", width: "100%", height: `${Math.max(220, labels.length * 52)}px`, marginBottom: "32px" }}>
          <canvas ref={barRef} role="img" aria-label="Improvement count chart" />
        </div>

        {/* Chart 2 */}
        <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Average DISC Score Change (Sem II − Sem I)</div>
        <div style={{ position: "relative", width: "100%", height: `${Math.max(200, labels.length * 48)}px` }}>
          <canvas ref={deltaRef} role="img" aria-label="Average DISC delta chart" />
        </div>

        {/* Table */}
        <div style={{ marginTop: "28px", overflowX: "auto" }}>
          <div style={{ marginBottom: "10px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Detailed Breakdown</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#dc2626" }}>
                {["Specialization","Total","Improved","Not Improved","No Sem II","Improve %","Avg Sem I","Avg Sem II","Δ Change"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: "11px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.spec} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111" }}>{d.spec}</td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{d.total}</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 700 }}>{d.improved}</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: 700 }}>{d.notImproved}</td>
                  <td style={{ padding: "10px 12px", color: "#888" }}>{d.noData}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "6px", background: "#f3f4f6", borderRadius: "3px", minWidth: "60px" }}>
                        <div style={{ width: `${d.improvePct}%`, height: "100%", background: d.improvePct >= 50 ? "#16a34a" : "#dc2626", borderRadius: "3px" }} />
                      </div>
                      <span style={{ fontWeight: 700, color: d.improvePct >= 50 ? "#16a34a" : "#dc2626", minWidth: "36px" }}>{d.improvePct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{d.avgSem1}</td>
                  <td style={{ padding: "10px 12px", color: "#555" }}>{d.avgSem2}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: d.avgDelta >= 0 ? "#16a34a" : "#dc2626" }}>
                    {d.avgDelta >= 0 ? "+" : ""}{d.avgDelta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   DISC ANALYSIS MODAL
═══════════════════════════════════════════════════ */

const DiscAnalysisModal = ({
  onClose, sem1Data, sem2Data, specializationOptions,
}: {
  onClose: () => void;
  sem1Data: Student[];
  sem2Data: Student[];
  specializationOptions: string[];
}) => {
  const [filterSpec, setFilterSpec] = useState("");

  const filtered1 = sem1Data.filter(s => !filterSpec || s.specialization === filterSpec);
  const filtered2 = sem2Data.filter(s => !filterSpec || s.specialization === filterSpec);
  const sem1Map = Object.fromEntries(filtered1.map(s => [String(s.registerNumber), s]));
  const sem2Map = Object.fromEntries(filtered2.map(s => [String(s.registerNumber), s]));
  const allRegs = [...new Set([...Object.keys(sem1Map), ...Object.keys(sem2Map)])];

  return (
    <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.analysisModal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>DISC Analysis</h2>
            <p style={styles.modalSub}>Semester I vs Semester II comparison per student</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Filter */}
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Filter by Specialization</label>
          <select
            style={styles.filterSelect}
            value={filterSpec}
            onChange={e => setFilterSpec(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializationOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          <span style={styles.countBadge}>{allRegs.length} student{allRegs.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Legend */}
        <div style={styles.discLegend}>
          {DISC_COLORS.map((color, i) => (
            <div key={i} style={styles.legendItem}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "#555" }}>{DISC_LABELS[i]}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        {allRegs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
            <div>No students found for this specialization</div>
          </div>
        ) : (
          <div style={styles.analysisGrid}>
            {allRegs.map(reg => {
              const s1 = sem1Map[reg] || null;
              const s2 = sem2Map[reg] || null;
              const student = s1 || s2!;
              const onlySem = !s1 ? "Sem II only" : !s2 ? "Sem I only" : "";

              return (
                <div key={reg} style={styles.analysisCard}>
                  <div style={styles.analysisCardTop}>
                    <div>
                      <div style={styles.analysisName}>{student.name}</div>
                      <div style={styles.analysisReg}>{reg} · {student.specialization}</div>
                    </div>
                    {onlySem && (
                      <span style={styles.onlyBadge}>{onlySem}</span>
                    )}
                  </div>
                  <div style={styles.pieRow}>
                    <DiscPieChart student={s1} label="Semester I" />
                    <div style={{ color: "#ccc", fontSize: "24px", alignSelf: "center" }}>→</div>
                    <DiscPieChart student={s2} label="Semester II" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════ */

const Dashboard = ({ role, onLogout }: { role: "admin" | "viewer"; onLogout: () => void }) => {
  const isAdmin = role === "admin";

  const [activeSem, setActiveSem] = useState<number>(1);
  const [availableSems, setAvailableSems] = useState<number[]>([1]);
  const [showCreateSem, setShowCreateSem] = useState(false);
  const [newSemNum, setNewSemNum] = useState("");

  const [data, setData] = useState<Student[]>([]);
  const [mode, setMode] = useState<Mode>("create");
  const [form, setForm] = useState<any>(emptyForm);

  const [topics, setTopics] = useState<Record<Subject, string[]>>({ d: [], i: [], s: [], c: [] });
  const [specializationOptions, setSpecializationOptions] = useState<string[]>([]);
  const [jobOptions, setJobOptions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [semCreating, setSemCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sem1Cache, setSem1Cache] = useState<Student[]>([]);
  const [sem2Cache, setSem2Cache] = useState<Student[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showSpecImprovement, setShowSpecImprovement] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Submitted" | "Not Submitted">("");

  /* ── Init ── */
  useEffect(() => { loadAvailableSems(); loadTopics(); loadDropdowns(); }, []);
  useEffect(() => { fetchAll(); setForm(emptyForm); setSearch(""); setStatusFilter(""); }, [activeSem]);

  const showMsg = (msg: string, type: "success" | "error") => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType(""); }, 3500);
  };

  const loadAvailableSems = async () => {
    try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getAvailableSems" }) });
      const json = await res.json();
      if (Array.isArray(json.semesters) && json.semesters.length > 0) {
        setAvailableSems(json.semesters);
        setActiveSem(json.semesters[0]);
      }
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?sem=${activeSem}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch { setData([]); }
    setLoading(false);
  };

  const loadTopics = async () => {
    for (const type of ["d", "i", "s", "c"] as Subject[]) {
      try {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getAssignments", type }) });
        const json = await res.json();
        setTopics(p => ({ ...p, [type]: json.assignments || [] }));
      } catch {}
    }
  };

  const loadDropdowns = async () => {
    try {
      const [sR, jR] = await Promise.all([
        fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getDropdowns", type: "specialization" }) }),
        fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "getDropdowns", type: "jobPreferred" }) }),
      ]);
      const sJ = await sR.json(); const jJ = await jR.json();
      setSpecializationOptions(sJ.options || []);
      setJobOptions(jJ.options || []);
    } catch {}
  };

  const post = async (payload: any) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ ...payload, sem: activeSem }) });
      const json = await res.json();
      setLoading(false);
      if (json?.error) { showMsg(json.message || "Something went wrong", "error"); return; }
      showMsg("Operation successful", "success");
      fetchAll(); setForm(emptyForm);
    } catch {
      setLoading(false);
      showMsg("Network error. Please try again.", "error");
    }
  };

  const handleCreateSemester = async () => {
    const num = parseInt(newSemNum);
    if (!num || num < 1 || num > 8) { showMsg("Enter a valid semester number (1–8)", "error"); return; }
    if (availableSems.includes(num)) { showMsg(`Semester ${num} already exists`, "error"); return; }
    setSemCreating(true);
    try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "createSemester", sem: num }) });
      const json = await res.json();
      if (json?.error) { showMsg(json.message || "Failed", "error"); }
      else {
        const updated = [...availableSems, num].sort((a, b) => a - b);
        setAvailableSems(updated); setActiveSem(num);
        setShowCreateSem(false); setNewSemNum("");
        showMsg(`${SEM_LABELS[num] || "Semester " + num} created!`, "success");
      }
    } catch { showMsg("Network error", "error"); }
    setSemCreating(false);
  };

  const toggleStatus = async (student: Student) => {
    if (!isAdmin) return;
    const newStatus = student.status === "Submitted" ? "Not Submitted" : "Submitted";
    setData(prev => prev.map(s => s.registerNumber === student.registerNumber ? { ...s, status: newStatus } : s));
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "updateStatus", registerNumber: student.registerNumber, status: newStatus, sem: activeSem }),
    });
  };

  const openAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}?sem=1`).then(r => r.json()),
        fetch(`${API_URL}?sem=2`).then(r => r.json()),
      ]);
      setSem1Cache(Array.isArray(r1) ? r1 : []);
      setSem2Cache(Array.isArray(r2) ? r2 : []);
      setShowAnalysis(true);
    } catch { showMsg("Failed to load analysis data", "error"); }
    setAnalysisLoading(false);
  };

  const downloadExcel = () => {
    if (!data.length) return;
    const rows = data.map(s => ({
      "Register Number": String(s.registerNumber), Name: s.name,
      Specialization: s.specialization || "", "Job Preferred": s.jobPreferred || "",
      D: s.d, I: s.i, S: s.s, C: s.c,
      Assignment: s.assignment || "", Status: s.status || "Not Submitted",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{wch:20},{wch:22},{wch:22},{wch:22},{wch:6},{wch:6},{wch:6},{wch:6},{wch:35},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, SEM_LABELS[activeSem] || "Semester");
    XLSX.writeFile(wb, `DISC_Report_Sem${activeSem}.xlsx`);
  };

  const filteredData = data.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(s.registerNumber).toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.specialization || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: data.length,
    submitted: data.filter(s => s.status === "Submitted").length,
    withAssignment: data.filter(s => s.assignment && s.assignment !== "No Assignment").length,
    lowScore: data.filter(s => [s.d,s.i,s.s,s.c].some(v => Number(v) < 25)).length,
  };

  return (
    <div style={styles.dashBg}>
      {/* ── TOP NAV ── */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.navLogo}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="2" fill="white" />
              <rect x="15" y="2" width="11" height="11" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="2" y="15" width="11" height="11" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="15" y="15" width="11" height="11" rx="2" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <div>
            <div style={styles.navTitle}>DISC Portal</div>
            <div style={styles.navSub}>Student Performance Management</div>
          </div>
        </div>
        <div style={styles.navRight}>
          <span style={{
            ...styles.rolePill,
            background: isAdmin ? "#dc2626" : "#6b7280",
          }}>
            {isAdmin ? "⚡ Admin" : "👁 Viewer"}
          </span>
          <button style={styles.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>
      </nav>

      <div style={styles.dashContent}>

        {/* ── STATS BAR ── */}
        <div style={styles.statsBar}>
          {[
            { label: "Total Students", value: stats.total, icon: "👥" },
            { label: "Submitted", value: stats.submitted, icon: "✅" },
            { label: "Assigned Topics", value: stats.withAssignment, icon: "📝" },
            { label: "Need Attention", value: stats.lowScore, icon: "⚠️" },
          ].map((st, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statIcon}>{st.icon}</div>
              <div style={styles.statVal}>{st.value}</div>
              <div style={styles.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* ── SEMESTER BAR ── */}
        <div style={styles.semBar}>
          <div style={styles.semLeft}>
            <span style={styles.semBarLabel}>SEMESTER</span>
            <div style={styles.semPills}>
              {availableSems.map(sem => (
                <button
                  key={sem}
                  onClick={() => setActiveSem(sem)}
                  style={{
                    ...styles.semPill,
                    background: activeSem === sem ? "#dc2626" : "transparent",
                    color: activeSem === sem ? "#fff" : "#555",
                    border: activeSem === sem ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
                    fontWeight: activeSem === sem ? 700 : 400,
                  }}
                >
                  Sem {sem}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.semRight}>
            {isAdmin && (
              showCreateSem ? (
                <div style={styles.createSemRow}>
                  <select
                    value={newSemNum}
                    onChange={e => setNewSemNum(e.target.value)}
                    style={styles.semSelect}
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].filter(n => !availableSems.includes(n)).map(n => (
                      <option key={n} value={n}>{SEM_LABELS[n]}</option>
                    ))}
                  </select>
                  <button
                    style={{ ...styles.redBtn, opacity: semCreating || !newSemNum ? 0.5 : 1 }}
                    disabled={semCreating || !newSemNum}
                    onClick={handleCreateSemester}
                  >
                    {semCreating ? "Creating…" : "Create"}
                  </button>
                  <button style={styles.ghostBtn} onClick={() => { setShowCreateSem(false); setNewSemNum(""); }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button style={styles.redBtn} onClick={() => setShowCreateSem(true)}>
                  + New Semester
                </button>
              )
            )}
            <button
              style={{ ...styles.outlineBtn, opacity: analysisLoading ? 0.6 : 1 }}
              onClick={openAnalysis}
              disabled={analysisLoading}
            >
              {analysisLoading ? "Loading…" : "📊 Analysis DISC"}
            </button>
            <button
              style={{ ...styles.outlineBtn, opacity: analysisLoading ? 0.6 : 1, borderColor: "#16a34a", color: "#16a34a" }}
              onClick={async () => {
                if (!sem1Cache.length && !sem2Cache.length) {
                  setAnalysisLoading(true);
                  try {
                    const [r1, r2] = await Promise.all([
                      fetch(`${API_URL}?sem=1`).then(r => r.json()),
                      fetch(`${API_URL}?sem=2`).then(r => r.json()),
                    ]);
                    setSem1Cache(Array.isArray(r1) ? r1 : []);
                    setSem2Cache(Array.isArray(r2) ? r2 : []);
                  } catch {}
                  setAnalysisLoading(false);
                }
                setShowSpecImprovement(true);
              }}
              disabled={analysisLoading}
            >
              {analysisLoading ? "Loading…" : "📈 Specialization Report"}
            </button>
            <button style={styles.greenBtn} onClick={downloadExcel} disabled={!data.length}>
              ↓ Export Excel
            </button>
          </div>
        </div>

        {/* ── ACTIVE SEM LABEL ── */}
        <div style={styles.semDivider}>
          <div style={styles.divLine} />
          <span style={styles.semActiveLabel}>{SEM_LABELS[activeSem] || "Semester " + activeSem}</span>
          <div style={styles.divLine} />
        </div>

        {/* ── MESSAGE ── */}
        {message && (
          <div style={{
            ...styles.msgBar,
            background: messageType === "success" ? "#f0fdf4" : "#fef2f2",
            borderColor: messageType === "success" ? "#16a34a" : "#dc2626",
            color: messageType === "success" ? "#166534" : "#991b1b",
          }}>
            {messageType === "success" ? "✓" : "✕"} {message}
          </div>
        )}

        {/* ── ADMIN FORM ── */}
        {isAdmin && (
          <div style={styles.formCard}>
            <div style={styles.formCardHeader}>
              <div style={styles.formCardTitle}>
                {mode === "create" ? "Add New Student" : mode === "updateScore" ? "Update DISC Score" : "Update Assignment"}
              </div>
              <div style={styles.modeTabs}>
                {([
                  { id: "create", label: "Add Student" },
                  { id: "updateScore", label: "Update Score" },
                  { id: "updateAssignment", label: "Update Assignment" },
                ] as { id: Mode; label: string }[]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setMode(t.id); setForm(emptyForm); }}
                    style={{
                      ...styles.modeTab,
                      background: mode === t.id ? "#dc2626" : "transparent",
                      color: mode === t.id ? "#fff" : "#666",
                      borderColor: mode === t.id ? "#dc2626" : "#e5e7eb",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formBody}>
              {/* Row 1: RegNo + Name */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Register Number *</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. 21CS001"
                    value={form.registerNumber}
                    onChange={e => setForm({ ...form, registerNumber: e.target.value })}
                  />
                </div>
                {mode === "create" && (
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Student Name *</label>
                    <input
                      style={styles.formInput}
                      placeholder="Full name"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Spec + Job */}
              {mode === "create" && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Specialization</label>
                    <select style={styles.formSelect} value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
                      <option value="">— Select —</option>
                      {specializationOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Job Preferred</label>
                    <select style={styles.formSelect} value={form.jobPreferred} onChange={e => setForm({ ...form, jobPreferred: e.target.value })}>
                      <option value="">— Select —</option>
                      {jobOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Row 3: DISC scores */}
              {mode !== "updateAssignment" && (
                <div style={styles.discScoreRow}>
                  {(["d", "i", "s", "c"] as Subject[]).map((k, idx) => (
                    <div key={k} style={styles.discScoreGroup}>
                      <label style={{ ...styles.formLabel, color: DISC_COLORS[idx] }}>{k.toUpperCase()}</label>
                      <input
                        style={styles.formInput}
                        type="number" min={0} max={100}
                        placeholder="0–100"
                        value={form[k]}
                        onChange={e => setForm({ ...form, [k]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Assignment text */}
              {mode === "updateAssignment" && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Assignment Topic</label>
                  <input
                    style={styles.formInput}
                    placeholder="Assignment topic"
                    value={form.assignment}
                    onChange={e => setForm({ ...form, assignment: e.target.value })}
                  />
                </div>
              )}

              <button
                style={{ ...styles.submitBtn, opacity: loading ? 0.65 : 1 }}
                disabled={loading}
                onClick={() => post({ action: mode, ...form })}
              >
                {loading ? "Processing…" : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* ── VIEWER NOTICE ── */}
        {!isAdmin && (
          <div style={styles.viewerNotice}>
            <span style={{ fontSize: "16px" }}>👁</span>
            <span>You are in <strong>View Only</strong> mode. Contact an admin to make changes.</span>
          </div>
        )}

        {/* ── SEARCH + FILTER ── */}
        <div style={styles.tableToolbar}>
          <input
            style={styles.searchInput}
            placeholder="Search by name, register number, specialization…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            style={styles.filterSelectSmall}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="">All Status</option>
            <option value="Submitted">Submitted</option>
            <option value="Not Submitted">Not Submitted</option>
          </select>
          <span style={styles.countLabel}>{filteredData.length} of {data.length} students</span>
        </div>

        {/* ── TABLE ── */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p style={{ color: "#888", marginTop: "12px" }}>Loading students…</p>
            </div>
          ) : filteredData.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    {["Reg No", "Name", "Specialization", "Job Preferred", "D", "I", "S", "C", "Assignment", "Status", ...(isAdmin ? ["Action"] : [])].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((s, idx) => (
                    <tr key={s.registerNumber} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ ...styles.td, fontFamily: "monospace", color: "#dc2626", fontWeight: 600 }}>{s.registerNumber}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{s.name}</td>
                      <td style={styles.td}>{s.specialization || "—"}</td>
                      <td style={styles.td}>{s.jobPreferred || "—"}</td>
                      {(["d","i","s","c"] as Subject[]).map((k, ki) => (
                        <td key={k} style={styles.td}>
                          <span style={{
                            padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                            background: Number(s[k]) < 25 ? "#fee2e2" : "#f0fdf4",
                            color: Number(s[k]) < 25 ? "#dc2626" : "#166534",
                            border: `1px solid ${Number(s[k]) < 25 ? "#fca5a5" : "#86efac"}`,
                          }}>
                            {s[k]}
                          </span>
                        </td>
                      ))}
                      {/* Assignment */}
                      <td style={{ ...styles.td, minWidth: "180px" }}>
                        <div style={{ fontSize: "12px", color: "#dc2626", marginBottom: "4px", lineHeight: 1.4 }}>
                          {s.assignment || "—"}
                        </div>
                        {isAdmin && (
                          <select
                            style={styles.assignSelect}
                            defaultValue=""
                            onChange={e => {
                              if (!e.target.value) return;
                              post({ action: "updateAssignment", registerNumber: s.registerNumber, assignment: e.target.value });
                              e.target.value = "";
                            }}
                          >
                            <option value="">Change topic…</option>
                            {Number(s.d) < 25 && topics.d.map((t, i) => <option key={i} value={`D - ${t}`}>D - {t}</option>)}
                            {Number(s.i) < 25 && topics.i.map((t, i) => <option key={i} value={`I - ${t}`}>I - {t}</option>)}
                            {Number(s.s) < 25 && topics.s.map((t, i) => <option key={i} value={`S - ${t}`}>S - {t}</option>)}
                            {Number(s.c) < 25 && topics.c.map((t, i) => <option key={i} value={`C - ${t}`}>C - {t}</option>)}
                          </select>
                        )}
                      </td>
                      {/* Status */}
                      <td style={styles.td}>
                        <button
                          onClick={() => toggleStatus(s)}
                          disabled={!isAdmin}
                          style={{
                            padding: "4px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 700,
                            cursor: isAdmin ? "pointer" : "default",
                            border: "none",
                            background: s.status === "Submitted" ? "#f0fdf4" : "#fef2f2",
                            color: s.status === "Submitted" ? "#166534" : "#991b1b",
                          }}
                        >
                          {s.status === "Submitted" ? "✓ Submitted" : "⏳ Pending"}
                        </button>
                      </td>
                      {/* Delete */}
                      {isAdmin && (
                        <td style={styles.td}>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => {
                              if (window.confirm(`Delete ${s.name} (${s.registerNumber})?`)) {
                                post({ action: "delete", registerNumber: s.registerNumber });
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#374151" }}>
                No students in {SEM_LABELS[activeSem] || "Semester " + activeSem}
              </div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
                {isAdmin ? "Use the form above to add a student." : "No data available yet."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ANALYSIS MODAL ── */}
      {showAnalysis && (
        <DiscAnalysisModal
          onClose={() => setShowAnalysis(false)}
          sem1Data={sem1Cache}
          sem2Data={sem2Cache}
          specializationOptions={specializationOptions}
        />
      )}

      {/* ── SPECIALIZATION IMPROVEMENT MODAL ── */}
      {showSpecImprovement && (
        <SpecImprovementModal
          onClose={() => setShowSpecImprovement(false)}
          sem1Data={sem1Cache}
          sem2Data={sem2Cache}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════ */

const App = () => {
  const [view, setView] = useState<AppView>("login");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");

  const handleLogin = (r: "admin" | "viewer") => { setRole(r); setView("dashboard"); };
  const handleLogout = () => { setRole("viewer"); setView("login"); };

  if (view === "login") return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard role={role} onLogout={handleLogout} />;
};

export default App;

/* ═══════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  /* LOGIN */
  loginBg: {
    minHeight: "100vh", background: "#dc2626",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
  },
  gridOverlay: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)",
    backgroundSize: "48px 48px",
  },
  loginCard: {
    position: "relative", zIndex: 1,
    background: "#fff", borderRadius: "20px",
    padding: "48px 44px", width: "100%", maxWidth: "440px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.25)",
  },
  loginBrand: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "36px" },
  brandIcon: {
    width: "52px", height: "52px", borderRadius: "14px", background: "#dc2626",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  brandTitle: { fontSize: "20px", fontWeight: 800, color: "#111", letterSpacing: "-0.02em" },
  brandSub: { fontSize: "12px", color: "#888", marginTop: "2px" },
  loginHeading: { fontSize: "26px", fontWeight: 800, color: "#111", marginBottom: "6px", letterSpacing: "-0.02em" },
  loginDesc: { fontSize: "13px", color: "#888", marginBottom: "28px" },
  inputGroup: { marginBottom: "18px" },
  inputLabel: { display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" },
  loginInput: {
    width: "100%", padding: "12px 16px", borderRadius: "10px",
    border: "1.5px solid #e5e7eb", fontSize: "15px", outline: "none",
    boxSizing: "border-box", background: "#f9fafb", color: "#111",
    transition: "border-color 0.15s",
  },
  eyeBtn: {
    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: 0,
  },
  loginError: {
    background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626",
    borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "14px",
  },
  loginBtn: {
    width: "100%", padding: "14px", borderRadius: "10px",
    background: "#dc2626", color: "#fff", border: "none",
    fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: "16px",
    letterSpacing: "0.01em",
  },
  divider: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  dividerText: { color: "#d1d5db", fontSize: "12px", padding: "0 4px" },
  viewerBtn: {
    width: "100%", padding: "13px", borderRadius: "10px",
    background: "#fff", color: "#374151",
    border: "1.5px solid #e5e7eb", fontSize: "14px",
    fontWeight: 600, cursor: "pointer",
  },

  /* DASHBOARD */
  dashBg: { minHeight: "100vh", background: "#f4f4f5", fontFamily: "'Segoe UI', sans-serif" },
  nav: {
    background: "#dc2626", padding: "0 32px", height: "64px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 16px rgba(220,38,38,0.3)",
  },
  navLeft: { display: "flex", alignItems: "center", gap: "14px" },
  navLogo: {
    width: "40px", height: "40px", borderRadius: "10px",
    background: "rgba(255,255,255,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  navTitle: { color: "#fff", fontWeight: 800, fontSize: "17px", letterSpacing: "-0.01em" },
  navSub: { color: "rgba(255,255,255,0.65)", fontSize: "11px" },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  rolePill: { color: "#fff", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff", padding: "7px 18px", borderRadius: "8px",
    fontSize: "13px", fontWeight: 600, cursor: "pointer",
  },

  dashContent: { maxWidth: "1400px", margin: "0 auto", padding: "28px 24px" },

  /* STATS */
  statsBar: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "20px" },
  statCard: {
    background: "#fff", borderRadius: "14px", padding: "20px 22px",
    border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "4px",
  },
  statIcon: { fontSize: "20px", marginBottom: "4px" },
  statVal: { fontSize: "28px", fontWeight: 800, color: "#dc2626", letterSpacing: "-0.03em" },
  statLabel: { fontSize: "12px", color: "#888", fontWeight: 500 },

  /* SEM BAR */
  semBar: {
    background: "#fff", borderRadius: "14px", padding: "16px 22px",
    border: "1px solid #e5e7eb", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "16px",
  },
  semLeft: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  semBarLabel: { fontSize: "10px", fontWeight: 800, color: "#dc2626", letterSpacing: "0.12em" },
  semPills: { display: "flex", gap: "8px", flexWrap: "wrap" },
  semPill: { padding: "6px 16px", borderRadius: "20px", fontSize: "13px", cursor: "pointer", transition: "all 0.15s" },
  semRight: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  createSemRow: { display: "flex", alignItems: "center", gap: "8px" },
  semSelect: { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", cursor: "pointer", background: "#fff" },
  redBtn: { padding: "9px 18px", borderRadius: "8px", background: "#dc2626", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
  ghostBtn: { padding: "9px 14px", borderRadius: "8px", background: "transparent", color: "#888", border: "1.5px solid #e5e7eb", fontSize: "13px", cursor: "pointer" },
  outlineBtn: { padding: "9px 18px", borderRadius: "8px", background: "#fff", color: "#dc2626", border: "1.5px solid #dc2626", fontSize: "13px", fontWeight: 700, cursor: "pointer" },
  greenBtn: { padding: "9px 18px", borderRadius: "8px", background: "#16a34a", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" },

  /* SEM DIVIDER */
  semDivider: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" },
  divLine: { flex: 1, height: "1px", background: "#e5e7eb" },
  semActiveLabel: { fontSize: "13px", fontWeight: 700, color: "#dc2626", whiteSpace: "nowrap" },

  /* MESSAGE */
  msgBar: { borderRadius: "10px", padding: "12px 18px", fontSize: "14px", fontWeight: 600, borderWidth: "1px", borderStyle: "solid", marginBottom: "16px" },

  /* VIEWER NOTICE */
  viewerNotice: {
    background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "10px",
    padding: "12px 18px", display: "flex", alignItems: "center", gap: "10px",
    fontSize: "13px", color: "#92400e", marginBottom: "16px",
  },

  /* FORM CARD */
  formCard: { background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "20px", overflow: "hidden" },
  formCardHeader: {
    padding: "18px 24px", borderBottom: "1px solid #f3f4f6",
    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
  },
  formCardTitle: { fontSize: "16px", fontWeight: 700, color: "#111" },
  modeTabs: { display: "flex", gap: "8px" },
  modeTab: { padding: "7px 16px", borderRadius: "8px", border: "1.5px solid", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" },
  formBody: { padding: "24px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  formLabel: { fontSize: "11px", fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" },
  formInput: {
    padding: "11px 14px", borderRadius: "8px", border: "1.5px solid #e5e7eb",
    fontSize: "14px", outline: "none", background: "#f9fafb", color: "#111",
    boxSizing: "border-box", width: "100%",
  },
  formSelect: {
    padding: "11px 14px", borderRadius: "8px", border: "1.5px solid #e5e7eb",
    fontSize: "14px", cursor: "pointer", background: "#f9fafb", color: "#111",
    width: "100%",
  },
  discScoreRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" },
  discScoreGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  submitBtn: {
    width: "100%", padding: "13px", borderRadius: "10px",
    background: "#dc2626", color: "#fff", border: "none",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
  },

  /* TOOLBAR */
  tableToolbar: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" },
  searchInput: {
    flex: 1, minWidth: "200px", padding: "10px 16px", borderRadius: "8px",
    border: "1.5px solid #e5e7eb", fontSize: "14px", background: "#fff", outline: "none", color: "#111",
  },
  filterSelectSmall: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", cursor: "pointer", background: "#fff", color: "#111" },
  countLabel: { fontSize: "12px", color: "#888", whiteSpace: "nowrap" },

  /* TABLE */
  tableCard: { background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "32px" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHead: { background: "#dc2626" },
  th: { padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase" },
  td: { padding: "13px 16px", fontSize: "13px", color: "#374151", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" },
  assignSelect: { width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "11px", cursor: "pointer", background: "#f9fafb", color: "#374151", marginTop: "4px" },
  deleteBtn: { color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" },

  loadingState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" },
  spinner: { width: "36px", height: "36px", border: "3px solid #fee2e2", borderTop: "3px solid #dc2626", borderRadius: "50%", animation: "spin 0.9s linear infinite" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", color: "#9ca3af" },

  /* ANALYSIS MODAL */
  modalOverlay: {
    position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "24px", overflowY: "auto",
  },
  analysisModal: {
    background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "900px",
    padding: "32px", boxShadow: "0 32px 64px rgba(0,0,0,0.2)", marginTop: "16px",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  modalTitle: { fontSize: "22px", fontWeight: 800, color: "#111", letterSpacing: "-0.02em" },
  modalSub: { fontSize: "13px", color: "#888", marginTop: "3px" },
  closeBtn: { background: "#f3f4f6", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "14px", cursor: "pointer", color: "#555", fontWeight: 700 },
  filterRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  filterLabel: { fontSize: "13px", color: "#555", fontWeight: 600 },
  filterSelect: { padding: "9px 14px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", cursor: "pointer", background: "#fff", color: "#111" },
  countBadge: { background: "#fee2e2", color: "#dc2626", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 },
  discLegend: { display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "20px", padding: "12px 16px", background: "#f9fafb", borderRadius: "10px" },
  legendItem: { display: "flex", alignItems: "center", gap: "6px" },
  analysisGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px" },
  analysisCard: { border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "18px" },
  analysisCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" },
  analysisName: { fontSize: "15px", fontWeight: 700, color: "#111" },
  analysisReg: { fontSize: "11px", color: "#888", marginTop: "2px", fontFamily: "monospace" },
  onlyBadge: { background: "#fffbeb", color: "#92400e", border: "1px solid #fcd34d", padding: "2px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" },
  pieRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
};