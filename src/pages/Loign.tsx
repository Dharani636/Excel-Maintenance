import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const storedUser = sessionStorage.getItem("regUser");
    const storedPass = sessionStorage.getItem("regPass");

    if (username === storedUser && password === storedPass) {
      sessionStorage.setItem("user", username);
      navigate("/home");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-white/60 text-sm">Sign in to access the dashboard</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition transform hover:scale-105 shadow-lg"
        >
          Sign In
        </button>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-semibold transition"
            >
              Create one
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
