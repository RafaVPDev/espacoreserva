import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useAvailability } from "../hooks/useAvailability";

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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venue") ?? "";

  const { availableDates, slots, loading } = useAvailability(venueId);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDaySlot = getFirstDayOfMonth(currentYear, currentMonth);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  function selectDate(dateStr: string) {
    if (!availableDates.includes(dateStr)) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedSlot) return;
    navigate(
      `/confirm?venue=${venueId}&date=${selectedDate}&slot=${selectedSlot}`,
    );
  }

  const currentSlots = selectedDate ? (slots[selectedDate] ?? []) : [];

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
          <h1 className="text-2xl font-bold text-gray-900">Escolha uma data</h1>
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
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(currentYear, currentMonth, day);
                  const isAvailable = availableDates.includes(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isPast =
                    new Date(dateStr) < new Date(today.toDateString());

                  return (
                    <button
                      key={day}
                      onClick={() => selectDate(dateStr)}
                      disabled={!isAvailable || isPast}
                      className={`
                        aspect-square rounded-xl text-sm font-medium transition-colors
                        ${
                          isSelected
                            ? "bg-orange-500 text-white"
                            : isAvailable && !isPast
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

            {/* Horários */}
            {selectedDate && (
              <div className="bg-white rounded-2xl border-2 border-orange-400 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-orange-500" />
                  <span className="font-semibold text-gray-900 text-sm">
                    Horários disponíveis
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {currentSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors
                        ${
                          selectedSlot === slot
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "border-orange-400 text-orange-500 hover:bg-orange-50"
                        }
                      `}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedSlot && (
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
