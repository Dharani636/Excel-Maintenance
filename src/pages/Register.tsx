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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-600 via-purple-600 to-pink-500">

      <div className="bg-white/15 backdrop-blur-lg rounded-xl shadow-xl p-10 w-100 text-white">
        <h2 className="text-3xl font-semibold text-center mb-8">Register</h2>

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
          onClick={handleRegister}
          className="w-full bg-white text-purple-700 font-semibold py-3 rounded-full hover:bg-gray-100 transition"
        >
          Register
        </button>

      </div>
    </div>
  );
};

export default Register;
