import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAvailability } from "../hooks/useAvailability";
import { useVenue } from "../hooks/useVenue";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
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

const SHIFT_LABEL: Record<string, string> = {
  diurno: "Diurno",
  noturno: "Noturno",
  especifico: "Específico",
};

const SHIFT_DESC: Record<string, string> = {
  diurno: "6h às 17h",
  noturno: "18h às 5h",
  especifico: "Horário a definir",
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

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venue") ?? "";

  const { venue } = useVenue(venueId);
  const { schedules, isShiftBooked, loading } = useAvailability(venueId);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDaySlot = getFirstDay(currentYear, currentMonth);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedShift(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedShift(null);
  }

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedShift(null);
    setCustomStart("");
    setCustomEnd("");
  }

  function getDayOfWeek(dateStr: string) {
    return new Date(dateStr + "T12:00:00").getDay();
  }

  function getSchedulesForDate(dateStr: string) {
    const dow = getDayOfWeek(dateStr);
    return schedules.filter((s) => s.day_of_week === dow && s.active);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedShift) return;
    const params = new URLSearchParams({
      venue: venueId,
      date: selectedDate,
      shift: selectedShift,
    });
    if (selectedShift === "especifico") {
      params.set("start", customStart);
      params.set("end", customEnd);
    }
    navigate(`/confirm?${params.toString()}`);
  }

  const dateSchedules = selectedDate ? getSchedulesForDate(selectedDate) : [];

  const canConfirm =
    selectedDate &&
    selectedShift &&
    (selectedShift !== "especifico" || (customStart && customEnd));

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{venue?.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{venue?.city}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Calendário */}
            <div className="bg-white rounded-2xl border-2 border-orange-400 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={prevMonth}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-semibold text-gray-900">
                  {MONTHS[currentMonth]} {currentYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
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
                  const isPast =
                    new Date(dateStr) < new Date(today.toDateString());
                  const isSelected = selectedDate === dateStr;
                  const daySchedules = getSchedulesForDate(dateStr);
                  const hasSchedule = daySchedules.length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() =>
                        !isPast && hasSchedule && selectDate(dateStr)
                      }
                      disabled={isPast || !hasSchedule}
                      className={`
                        aspect-square rounded-xl text-sm font-medium transition-colors relative
                        ${
                          isSelected
                            ? "bg-orange-500 text-white"
                            : hasSchedule && !isPast
                              ? "bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"
                              : "text-gray-300 cursor-default"
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-orange-100" />
                  <span className="text-xs text-gray-400">Disponível</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-orange-500" />
                  <span className="text-xs text-gray-400">Selecionado</span>
                </div>
              </div>
            </div>

            {/* Turnos */}
            {selectedDate && dateSchedules.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-orange-400 p-6 mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Turnos disponíveis
                </p>
                <div className="flex flex-col gap-3">
                  {dateSchedules.map((schedule) => {
                    const booked = isShiftBooked(selectedDate!, schedule.shift);
                    return (
                      <button
                        key={schedule.id}
                        onClick={() =>
                          !booked && setSelectedShift(schedule.shift)
                        }
                        disabled={booked}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                          booked
                            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50"
                            : selectedShift === schedule.shift
                              ? "bg-orange-50 border-orange-400"
                              : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              booked
                                ? "text-gray-400"
                                : selectedShift === schedule.shift
                                  ? "text-orange-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {SHIFT_LABEL[schedule.shift]}
                            {booked && (
                              <span className="text-xs ml-2 text-gray-400">
                                (Reservado)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {schedule.shift === "especifico"
                              ? SHIFT_DESC.especifico
                              : `${schedule.start_time.slice(0, 5)} às ${schedule.end_time.slice(0, 5)}`}
                          </p>
                        </div>
                        {schedule.price != null && !booked && (
                          <span className="text-sm font-semibold text-orange-500">
                            {schedule.price.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Horário específico */}
                {selectedShift === "especifico" && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Entrada
                      </label>
                      <input
                        type="time"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Saída
                      </label>
                      <input
                        type="time"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {canConfirm && (
              <button
                onClick={handleConfirm}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 rounded-2xl transition-colors text-lg"
              >
                Continuar
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
