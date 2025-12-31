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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-600 via-purple-600 to-pink-500">

      <div className="bg-white/15 backdrop-blur-lg rounded-xl shadow-xl p-10 w-100 text-white">
        <h2 className="text-3xl font-semibold text-center mb-8">Login</h2>

        <input
          type="text"
          placeholder="User Name"
          className="w-full bg-white/20 border border-white/30 rounded px-4 py-3 mb-4 text-white placeholder-white/70 focus:outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full bg-white/20 border border-white/30 rounded px-4 py-3 mb-6 text-white placeholder-white/70 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-white text-purple-700 font-semibold py-3 rounded-full hover:bg-gray-100 transition"
        >
          Login
        </button>

        <p
          onClick={() => navigate("/register")}
          className="text-center mt-4 cursor-pointer hover:underline"
        >
          Create Account
        </p>

      </div>
    </div>
  );
};

export default Login;
