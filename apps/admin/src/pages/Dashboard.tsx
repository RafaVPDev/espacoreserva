import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

type Booking = {
  id: string;
  status: string;
  party_type: string;
  notes: string | null;
  owner_notes: string | null;
  shift: string | null;
  start_time: string | null;
  end_time: string | null;
  slot_date: string | null;
  venue_name: string;
  client_name: string;
  client_phone: string;
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const SHIFT_LABEL: Record<string, string> = {
  diurno: "Diurno",
  noturno: "Noturno",
  especifico: "Específico",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("admin_bookings")
        .select(
          "id, status, party_type, notes, owner_notes, shift, start_time, end_time, slot_date, venue_name, client_name, client_phone",
        );
      setBookings(data ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function fetchBookings() {
    const { data } = await supabase
      .from("admin_bookings")
      .select(
        "id, status, party_type, notes, owner_notes, shift, start_time, end_time, slot_date, venue_name, client_name, client_phone",
      );
    setBookings(data ?? []);
  }

  async function handleStatus(id: string, status: string) {
    setSaving(true);
    await supabase.from("bookings").update({ status }).eq("id", id);
    setSaving(false);
    fetchBookings();
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  }

  function getBookingsForDate(dateStr: string) {
    return bookings.filter(
      (b) => b.slot_date === dateStr && b.status !== "rejected",
    );
  }

  function getDayColor(dateStr: string) {
    const dayBookings = bookings.filter(
      (b) => b.slot_date === dateStr && b.status !== "rejected",
    );
    if (dayBookings.length === 0) return null;

    const shifts = ["diurno", "noturno", "especifico"];
    const bookedShifts = dayBookings.map((b) => b.shift);
    const allBooked = shifts.every((s) => bookedShifts.includes(s));

    if (allBooked) return "full";
    return "partial";
  }

  function selectDate(dateStr: string) {
    const dayBookings = getBookingsForDate(dateStr);
    if (dayBookings.length === 0) return;
    setSelectedDate(dateStr);
    setPanelOpen(true);
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDaySlot = getFirstDay(currentYear, currentMonth);
  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  return (
    <div className="relative">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-orange-500" },
          {
            label: "Pendentes",
            value: stats.pending,
            color: "text-yellow-500",
          },
          {
            label: "Aprovados",
            value: stats.approved,
            color: "text-green-500",
          },
          { label: "Recusados", value: stats.rejected, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 justify-center">
        {/* Calendário */}
        {loading ? (
          <div className="flex justify-center py-20 flex-1">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-gray-900 text-sm">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-gray-400 font-medium py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDaySlot }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = toDateStr(currentYear, currentMonth, day);
                const color = getDayColor(dateStr);
                const isSelected = selectedDate === dateStr && panelOpen;

                return (
                  <button
                    key={day}
                    onClick={() => selectDate(dateStr)}
                    className={`
                    aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                    ${isSelected ? "ring-2 ring-orange-400" : ""}
                    ${
                      color === "full"
                        ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                        : color === "partial"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                          : "text-gray-500 hover:bg-gray-50"
                    }
                  `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-100" />
                <span className="text-xs text-gray-400">
                  Parcialmente ocupado
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-100" />
                <span className="text-xs text-gray-400">
                  Totalmente ocupado
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Painel lateral - desktop */}
        {panelOpen && selectedDate && (
          <>
            {/* Overlay mobile */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => {
                setPanelOpen(false);
                setSelectedDate(null);
              }}
            />

            {/* Painel */}
            <div
              className={`
      bg-white border border-gray-100 flex flex-col
      fixed inset-x-4 bottom-4 top-20 z-50 rounded-2xl shadow-2xl
      lg:static lg:inset-auto lg:w-72 lg:rounded-2xl lg:shadow-none lg:max-h-[600px]
    `}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      },
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedBookings.length} agendamento
                    {selectedBookings.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPanelOpen(false);
                    setSelectedDate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {selectedBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.client_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.client_phone}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-lg ${STATUS_CLASS[booking.status]}`}
                      >
                        {STATUS_LABEL[booking.status]}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mb-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Espaço:</span>{" "}
                        {booking.venue_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Turno:</span>{" "}
                        {booking.shift ? SHIFT_LABEL[booking.shift] : "-"}
                      </p>
                      {booking.shift === "especifico" && booking.start_time && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Horário:</span>{" "}
                          {booking.start_time.slice(0, 5)} às{" "}
                          {booking.end_time?.slice(0, 5)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Festa:</span>{" "}
                        {booking.party_type}
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Obs:</span>{" "}
                          {booking.notes}
                        </p>
                      )}
                      {booking.owner_notes && (
                        <p className="text-xs text-orange-500">
                          <span className="font-medium">Nota interna:</span>{" "}
                          {booking.owner_notes}
                        </p>
                      )}
                    </div>
                    {booking.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(booking.id, "rejected")}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium py-1.5 rounded-lg transition-colors"
                        >
                          <X size={11} /> Recusar
                        </button>
                        <button
                          onClick={() => handleStatus(booking.id, "approved")}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                        >
                          <Check size={11} /> Aprovar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
