import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useVenue } from "../hooks/useVenue";

const PARTY_TYPES = [
  "Aniversário",
  "Casamento",
  "Formatura",
  "Confraternização",
  "Chá de bebê",
  "Outro",
];

const SHIFT_LABEL: Record<string, string> = {
  diurno: "Diurno (6h às 17h)",
  noturno: "Noturno (18h às 5h)",
  especifico: "Específico",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default function Confirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const venueId = searchParams.get("venue") ?? "";
  const date = searchParams.get("date") ?? "";
  const shift = searchParams.get("shift") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const { venue } = useVenue(venueId);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partyType, setPartyType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name || !phone || !partyType) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({ name, phone, email: email || null })
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
                {venue?.name} - {venue?.city}
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
              E-mail{" "}
              <span className="text-gray-400 text-xs font-normal">
                (opcional)
              </span>
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
