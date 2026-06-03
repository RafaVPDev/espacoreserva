import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type RecentBooking = {
  id: string;
  client_name: string;
  venue_name: string;
  slot_date: string;
  slot_time: string;
  status: string;
  party_type: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
  rescheduled: "Remarcado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
  rescheduled: "bg-blue-50 text-blue-600",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recent, setRecent] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("admin_bookings")
        .select(
          "id, client_name, venue_name, slot_date, slot_time, status, party_type",
        )
        .order("created_at", { ascending: false });

      if (data) {
        setStats({
          total: data.length,
          pending: data.filter((b) => b.status === "pending").length,
          approved: data.filter((b) => b.status === "approved").length,
          rejected: data.filter((b) => b.status === "rejected").length,
        });
        setRecent(data.slice(0, 5));
      }

      setLoading(false);
    }

    fetch();
  }, []);

  const cards = [
    {
      label: "Total",
      value: stats.total,
      icon: CalendarDays,
      color: "text-orange-500 bg-orange-50",
    },
    {
      label: "Pendentes",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-500 bg-yellow-50",
    },
    {
      label: "Aprovados",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-green-500 bg-green-50",
    },
    {
      label: "Recusados",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-500 bg-red-50",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recentes */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">
                Agendamentos recentes
              </h3>
            </div>
            {recent.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">
                Nenhum agendamento ainda.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                      Cliente
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                      Espaço
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                      Data
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.client_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {booking.venue_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(booking.slot_date)} às{" "}
                        {booking.slot_time.slice(0, 5)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_CLASS[booking.status]}`}
                        >
                          {STATUS_LABEL[booking.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
