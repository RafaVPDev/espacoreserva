import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  LogOut,
  Building2,
  UserCog,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";

const superAdminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/bookings", icon: BookOpen, label: "Agendamentos" },
  { to: "/owners", icon: UserCog, label: "Donos" },
  { to: "/clients", icon: Users, label: "Clientes" },
];

const venueOwnerLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/bookings", icon: BookOpen, label: "Agendamentos" },
  { to: "/venues", icon: Building2, label: "Meus Espaços" },
  { to: "/slots", icon: CalendarDays, label: "Disponibilidade" },
  { to: "/clients", icon: Users, label: "Clientes" },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const links =
    profile?.role === "super_admin" ? superAdminLinks : venueOwnerLinks;

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">Reserva Aí</h1>
        <p className="text-xs text-gray-400 mt-0.5">Portal admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-50 text-orange-500"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-gray-900 truncate">
            {profile?.full_name}
          </p>
          <p className="text-xs text-gray-400">
            {profile?.role === "super_admin" ? "Super admin" : "Dono de espaço"}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
