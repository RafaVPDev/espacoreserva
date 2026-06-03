import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Plus, Trash2, X } from "lucide-react";

type Venue = { id: string; name: string };

type Schedule = {
  id: string;
  day_of_week: number;
  shift: "diurno" | "noturno" | "especifico";
  start_time: string;
  end_time: string;
  price: number | null;
  active: boolean;
};

const DAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const SHIFT_DEFAULTS = {
  diurno: { start: "06:00", end: "17:00" },
  noturno: { start: "18:00", end: "05:00" },
  especifico: { start: "00:00", end: "23:59" },
};

const SHIFT_LABEL = {
  diurno: "Diurno",
  noturno: "Noturno",
  especifico: "Específico",
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Slots() {
  const { user } = useAuth();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedShift, setSelectedShift] = useState<
    "diurno" | "noturno" | "especifico"
  >("diurno");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("17:00");
  const [price, setPrice] = useState("");

  const [copyingFrom, setCopyingFrom] = useState<number | null>(null);
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("venues")
        .select("id, name")
        .eq("owner_id", user!.id)
        .eq("active", true)
        .order("name");
      setVenues(data ?? []);
      if (data && data.length > 0) setVenueId(data[0].id);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!venueId) return;
    fetchSchedules();
  }, [venueId]);

  async function fetchSchedules() {
    setLoading(true);
    const { data } = await supabase
      .from("venue_schedules")
      .select("id, day_of_week, shift, start_time, end_time, price, active")
      .eq("venue_id", venueId)
      .order("day_of_week")
      .order("shift");
    setSchedules(data ?? []);
    setLoading(false);
  }

  function handleShiftChange(shift: "diurno" | "noturno" | "especifico") {
    setSelectedShift(shift);
    setStartTime(SHIFT_DEFAULTS[shift].start);
    setEndTime(SHIFT_DEFAULTS[shift].end);
  }

  async function handleAdd() {
    if (!startTime || !endTime) {
      setError("Informe os horários.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from("venue_schedules").insert({
        venue_id: venueId,
        day_of_week: selectedDay,
        shift: selectedShift,
        start_time: startTime,
        end_time: endTime,
        price: price ? parseFloat(price.replace(",", ".")) : null,
        active: true,
      });
      if (error) {
        if (error.code === "23505")
          throw new Error("Já existe esse turno nesse dia.");
        throw error;
      }
      setPrice("");
      fetchSchedules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("venue_schedules").delete().eq("id", id);
    fetchSchedules();
  }

  async function handleToggle(schedule: Schedule) {
    await supabase
      .from("venue_schedules")
      .update({ active: !schedule.active })
      .eq("id", schedule.id);
    fetchSchedules();
  }

  async function handleCopy() {
    if (copyingFrom === null || copyTargets.length === 0) return;
    setCopying(true);
    try {
      const sourceDaySchedules = schedules.filter(
        (s) => s.day_of_week === copyingFrom,
      );
      for (const target of copyTargets) {
        for (const schedule of sourceDaySchedules) {
          await supabase.from("venue_schedules").upsert(
            {
              venue_id: venueId,
              day_of_week: target,
              shift: schedule.shift,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              price: schedule.price,
              active: schedule.active,
            },
            { onConflict: "venue_id,day_of_week,shift" },
          );
        }
      }
      setCopyingFrom(null);
      setCopyTargets([]);
      fetchSchedules();
    } finally {
      setCopying(false);
    }
  }

  const groupedByDay = DAYS.map((label, index) => ({
    label,
    index,
    schedules: schedules.filter((s) => s.day_of_week === index),
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Disponibilidade
        </h2>
        {venues.length > 0 && (
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full border-2 border-orange-400 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-500 transition-colors bg-white font-medium"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {venues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-10 text-center text-gray-400 text-sm">
          Nenhum espaço ativo. Cadastre um espaço primeiro.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">
              Adicionar disponibilidade
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia da semana
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((label, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(index)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-colors ${
                        selectedDay === index
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-500 hover:border-orange-300"
                      }`}
                    >
                      {label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turno
                </label>
                <div className="flex flex-col gap-2">
                  {(["diurno", "noturno", "especifico"] as const).map(
                    (shift) => (
                      <button
                        key={shift}
                        onClick={() => handleShiftChange(shift)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors text-left ${
                          selectedShift === shift
                            ? "bg-orange-50 border-orange-400 text-orange-600"
                            : "border-gray-200 text-gray-500 hover:border-orange-300"
                        }`}
                      >
                        {SHIFT_LABEL[shift]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d,]/g, ""))
                  }
                  placeholder="Ex: 450,00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
              >
                <Plus size={16} />
                {saving ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 px-6 py-10 text-center text-gray-400 text-sm">
                Nenhuma disponibilidade cadastrada ainda.
              </div>
            ) : (
              groupedByDay.map(
                ({ label, index, schedules: daySchedules }) =>
                  daySchedules.length > 0 && (
                    <div
                      key={index}
                      className="bg-white rounded-2xl border border-gray-100 p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {label}
                        </h4>
                        <button
                          onClick={() => {
                            setCopyingFrom(index);
                            setCopyTargets([]);
                          }}
                          className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                        >
                          Copiar para...
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                              schedule.active
                                ? "border-orange-200 bg-orange-50"
                                : "border-gray-100 bg-gray-50"
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-sm font-medium ${schedule.active ? "text-gray-900" : "text-gray-400"}`}
                              >
                                {SHIFT_LABEL[schedule.shift]}
                              </span>
                              <span className="text-xs text-gray-400">
                                {schedule.start_time.slice(0, 5)} às{" "}
                                {schedule.end_time.slice(0, 5)}
                                {schedule.price != null &&
                                  ` · ${formatPrice(schedule.price)}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggle(schedule)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                                  schedule.active
                                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                              >
                                {schedule.active ? "Ativo" : "Inativo"}
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )
            )}
          </div>
        </div>
      )}

      {/* Modal copiar */}
      {copyingFrom !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Copiar de {DAYS[copyingFrom]}
              </h3>
              <button
                onClick={() => setCopyingFrom(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-2">
              <p className="text-sm text-gray-500 mb-2">
                Selecione os dias de destino:
              </p>
              {DAYS.map(
                (label, index) =>
                  index !== copyingFrom && (
                    <label
                      key={index}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={copyTargets.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setCopyTargets((t) => [...t, index]);
                          else
                            setCopyTargets((t) => t.filter((d) => d !== index));
                        }}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ),
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setCopyingFrom(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopy}
                disabled={copying || copyTargets.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {copying ? "Copiando..." : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
