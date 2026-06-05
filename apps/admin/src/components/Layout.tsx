import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <div
        className={`
        fixed top-0 left-0 h-full z-40 transition-transform duration-300
        lg:hidden
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar desktop - sticky */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">
        <Sidebar />
      </div>

      {/* Conteúdo */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-orange-500 transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900 text-sm">
            Reserva Aí
          </span>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
