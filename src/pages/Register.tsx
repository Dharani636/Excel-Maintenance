import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!username || !password) {
      alert("All fields required");
      return;
    }

    sessionStorage.setItem("regUser", username);
    sessionStorage.setItem("regPass", password);

    alert("Registered successfully!");

    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Create Account
          </h2>
          <p className="text-white/60 text-sm">Join the dashboard today</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleRegister}
          className="w-full mt-6 bg-linear-to-r from-purple-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:from-purple-400 hover:to-cyan-400 transition transform hover:scale-105 shadow-lg"
        >
          Create Account
        </button>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-purple-400 hover:text-purple-300 cursor-pointer font-semibold transition"
            >
              Sign in here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
