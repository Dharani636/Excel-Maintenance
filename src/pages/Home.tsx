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

const API_URL =
  "https://script.google.com/macros/s/AKfycbxzTuJmUqYpV-9N-fu9Wmu0Nsp2bU3u8H-zSj6InQGjzSdgrERI5iNFWhuQ80Mb4KXQjw/exec";

const Home = () => {
  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    registerNumber: "",
    name: "",
    d: "",
    s: "",
    c: "",
    i: "",
    assignment: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(API_URL);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const post = async (payload: any) => {
    await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });
    fetchAll();
  };


  const downloadExcel = () => {
    if (data.length === 0) return;

    const headers = [
      "Register Number",
      "Name",
      "D",
      "S",
      "C",
      "I",
      "Assignment",
    ];

    const rows = data.map((s) => [
      `="${s.registerNumber}"`,
      s.name,
      s.d,
      s.s,
      s.c,
      s.i,
      s.assignment,
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map(String).join(","))
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_scores.csv"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Navbar />

      <section className="pt-28 pb-16 px-4 bg-linear-to-br from-[#0b0f14] via-[#0e1420] to-black min-h-screen">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-white mb-10">
            📊 Student Performance Dashboard
          </h2>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8 shadow-xl">
            <h3 className="text-white text-lg font-semibold mb-4">
              Manage Student Data
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["registerNumber", "Register No"],
                ["name", "Name"],
                ["d", "D"],
                ["s", "S"],
                ["c", "C"],
                ["i", "I"],
              ].map(([name, placeholder]) => (
                <input
                  key={name}
                  name={name}
                  placeholder={placeholder}
                  onChange={handleChange}
                  className="bg-black/40 text-white placeholder-gray-400 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              ))}

              <input
                name="assignment"
                placeholder="Assignment"
                onChange={handleChange}
                className="col-span-2 md:col-span-4 bg-black/40 text-white placeholder-gray-400 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <button
                onClick={() =>
                  post({
                    action: "create",
                    registerNumber: form.registerNumber,
                    name: form.name,
                    d: Number(form.d),
                    s: Number(form.s),
                    c: Number(form.c),
                    i: Number(form.i),
                  })
                }
                className="bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full hover:scale-105 transition"
              >
                ➕ Create
              </button>

              <button
                onClick={() =>
                  post({
                    action: "updateScore",
                    registerNumber: form.registerNumber,
                    d: Number(form.d),
                    s: Number(form.s),
                    c: Number(form.c),
                    i: Number(form.i),
                  })
                }
                className="bg-linear-to-r from-blue-500 to-cyan-600 text-white px-6 py-2 rounded-full hover:scale-105 transition"
              >
                🔄 Update Score
              </button>

              <button
                onClick={() =>
                  post({
                    action: "updateAssignment",
                    registerNumber: form.registerNumber,
                    assignment: form.assignment,
                  })
                }
                className="bg-linear-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-full hover:scale-105 transition"
              >
                ✏️ Update Assignment
              </button>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={downloadExcel}
              className="bg-linear-to-r from-yellow-400 to-orange-500 text-black font-semibold px-6 py-2 rounded-full hover:scale-105 transition"
            >
              ⬇ Download Excel
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-x-auto">
            {loading ? (
              <p className="text-center text-white py-8">Loading...</p>
            ) : (
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/10 text-cyan-300">
                  <tr>
                    {["Reg", "Name", "D", "S", "C", "I", "Assignment", "Action"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3 text-left">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-400">
                        No Records Found
                      </td>
                    </tr>
                  ) : (
                    data.map((item, i) => (
                      <tr
                        key={i}
                        className="border-t border-white/10 hover:bg-white/5 transition"
                      >
                        <td className="px-4 py-3">{item.registerNumber}</td>
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.d}</td>
                        <td className="px-4 py-3">{item.s}</td>
                        <td className="px-4 py-3">{item.c}</td>
                        <td className="px-4 py-3">{item.i}</td>
                        <td className="px-4 py-3 text-pink-400 font-medium">
                          {item.assignment}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              post({
                                action: "delete",
                                registerNumber: item.registerNumber,
                              })
                            }
                            className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-1 rounded-full hover:bg-red-500/40 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
