import { useNavigate } from "react-router-dom";
import logo from "../assets/kv.jpg";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-black/95 backdrop-blur-md text-white fixed w-full z-50 shadow-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="flex justify-between items-center h-20">

          <div className="flex items-center space-x-4 flex-shrink-0">
            <img
              src={logo}
              alt="College Logo"
              className="w-12 h-12 object-contain rounded-lg shadow-lg hover:scale-110 transition"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                KVIM
              </span>
              <p className="text-xs text-white/60">Business School</p>
            </div>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <h1 className="text-base font-semibold tracking-wide text-center bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              KV Institute of Management
            </h1>
            <p className="text-xs text-white/50 text-center">And Information Studies</p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 px-6 py-2.5 rounded-lg text-sm font-semibold transition transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
