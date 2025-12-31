import { useNavigate } from "react-router-dom";
import logo from "../assets/kv.jpg";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white fixed w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="flex justify-between items-center h-16">

          <div className="flex items-center space-x-3">
            <img
              src={logo}
              alt="College Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-lg font-semibold tracking-wide">
              KVIM BUSINESS SCHOOL
            </span>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-base sm:text-lg font-semibold tracking-wide text-center">
              KV Institute of Management and Information Studies
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
