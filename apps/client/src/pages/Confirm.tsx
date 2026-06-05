import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";

const PARTY_TYPES = [
  "Aniversário",
  "Casamento",
  "Formatura",
  "Confraternização",
  "Chá de bebê",
  "Outro",
];

const SHIFT_LABEL: Record<string, string> = {
  diurno: "Diurno",
  noturno: "Noturno",
  especifico: "Específico",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

type VenueDetails = {
  name: string;
  city: string;
  capacity: number | null;
  min_advance_hours: number | null;
};

export default function Confirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const venueId = searchParams.get("venue") ?? "";
  const date = searchParams.get("date") ?? "";
  const shift = searchParams.get("shift") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const [venueDetails, setVenueDetails] = useState<VenueDetails | null>(null);

  useEffect(() => {
    if (!venueId) return;
    supabase
      .from("venues")
      .select("name, city, capacity, min_advance_hours")
      .eq("id", venueId)
      .single()
      .then(({ data }) => setVenueDetails(data));
  }, [venueId]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [partyType, setPartyType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name || !phone || !cpf || !partyType || !guestCount) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (
      venueDetails?.capacity &&
      parseInt(guestCount) > venueDetails.capacity
    ) {
      setError(
        `Este espaço comporta no máximo ${venueDetails.capacity} pessoas.`,
      );
      return;
    }

    if (venueDetails?.min_advance_hours) {
      const shiftStartHour =
        shift === "diurno"
          ? 6
          : shift === "noturno"
            ? 18
            : parseInt(start.split(":")[0] || "0");
      const eventDateTime = new Date(
        `${date}T${String(shiftStartHour).padStart(2, "0")}:00:00`,
      );
      const minAdvanceMs = venueDetails.min_advance_hours * 60 * 60 * 1000;
      if (eventDateTime.getTime() - new Date().getTime() < minAdvanceMs) {
        setError(
          `Este espaço exige reserva com pelo menos ${venueDetails.min_advance_hours}h de antecedência.`,
        );
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Busca o preço do turno
      const { data: scheduleData } = await supabase
        .from("venue_schedules")
        .select("price")
        .eq("venue_id", venueId)
        .eq("shift", shift as string)
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          name,
          phone,
          cpf: cpf.replace(/\D/g, ""),
          email: email || null,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      const { error: bookingError } = await supabase.from("bookings").insert({
        client_id: client.id,
        venue_id: venueId,
        party_type: partyType,
        notes: notes || null,
        shift,
        start_time: shift === "especifico" ? start : null,
        end_time: shift === "especifico" ? end : null,
        slot_date: date,
        guest_count: parseInt(guestCount),
        price: scheduleData?.price ?? null,
        amount_paid: 0,
      });

      if (bookingError) throw bookingError;

      navigate("/success");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao realizar reserva. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-orange-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Confirmar reserva
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Preencha seus dados para finalizar.
        </p>

        {/* Resumo */}
        <div className="bg-white rounded-2xl border-2 border-orange-400 p-5 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={15} className="text-orange-500 shrink-0" />
              <span>
                {venueDetails?.name} - {venueDetails?.city}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={15} className="text-orange-500 shrink-0" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={15} className="text-orange-500 shrink-0" />
              <span>
                {SHIFT_LABEL[shift]}
                {shift === "especifico" &&
                  start &&
                  end &&
                  ` · ${start} às ${end}`}
              </span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl border-2 border-orange-400 p-6 flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                const formatted = digits
                  .replace(/^(\d{3})(\d)/, "$1.$2")
                  .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                  .replace(/\.(\d{3})(\d)/, ".$1-$2");
                setCpf(formatted);
              }}
              placeholder="000.000.000-00"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone <span className="text-orange-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                const formatted = digits
                  .replace(/^(\d{2})(\d)/, "($1) $2")
                  .replace(/(\d{5})(\d)/, "$1-$2");
                setPhone(formatted);
              }}
              placeholder="(00) 00000-0000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail <span className="text-orange-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de pessoas <span className="text-orange-500">*</span>
              {venueDetails?.capacity && (
                <span className="text-gray-400 text-xs font-normal ml-1">
                  (máx. {venueDetails.capacity})
                </span>
              )}
            </label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              min="1"
              max={venueDetails?.capacity ?? undefined}
              placeholder="Quantas pessoas?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de festa <span className="text-orange-500">*</span>
            </label>
            <select
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors bg-white"
            >
              <option value="" disabled>
                Selecione
              </option>
              {PARTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações{" "}
              <span className="text-gray-400 text-xs font-normal">
                (opcional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Algum detalhe importante sobre o evento..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-4 rounded-2xl transition-colors text-lg"
        >
          {loading ? "Enviando..." : "Confirmar reserva"}
        </button>
      </div>
    </main>
  );
}
