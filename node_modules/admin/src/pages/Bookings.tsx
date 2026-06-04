import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Check, X, Copy, Pencil } from "lucide-react";
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
  created_at: string;
  venue_id: string;
  venue_name: string;
  venue_address: string | null;
  venue_number: string | null;
  venue_district: string | null;
  venue_city: string | null;
  venue_state: string | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
};

type Profile = {
  pix_key: string | null;
  msg_template: string | null;
  whatsapp: string | null;
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

const SHIFT_LABEL: Record<string, string> = {
  diurno: "Diurno",
  noturno: "Noturno",
  especifico: "Específico",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function buildAddress(booking: Booking) {
  return [
    booking.venue_address,
    booking.venue_number,
    booking.venue_district,
    booking.venue_city,
    booking.venue_state,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [ownerNotes, setOwnerNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);

  useEffect(() => {
    fetchBookings();
    if (user) loadProfile();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase.from("admin_bookings").select("*");
    setBookings(data ?? []);
    setLoading(false);
  }

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("pix_key, msg_template, whatsapp")
      .eq("id", user!.id)
      .single();
    setProfile(data);
  }

  function openDetail(booking: Booking) {
    setSelected(booking);
    setOwnerNotes(booking.owner_notes ?? "");
    setRescheduleDate(booking.slot_date ?? "");
    setEditingDate(false);
    setCopied(false);
  }

  function closeDetail() {
    setSelected(null);
    setEditingDate(false);
  }

  async function handleStatus(status: string) {
    if (!selected) return;
    setSaving(true);
    await supabase.from("bookings").update({ status }).eq("id", selected.id);
    setSaving(false);
    fetchBookings();
    setSelected((prev) => (prev ? { ...prev, status } : null));
  }

  async function handleSaveNotes() {
    if (!selected) return;
    setSaving(true);
    await supabase
      .from("bookings")
      .update({ owner_notes: ownerNotes || null })
      .eq("id", selected.id);
    setSaving(false);
    fetchBookings();
    setSelected((prev) => (prev ? { ...prev, owner_notes: ownerNotes } : null));
  }

  async function handleReschedule() {
    if (!selected || !rescheduleDate) return;
    setSaving(true);
    await supabase
      .from("bookings")
      .update({ slot_date: rescheduleDate })
      .eq("id", selected.id);
    setSaving(false);
    setEditingDate(false);
    fetchBookings();
    setSelected((prev) =>
      prev ? { ...prev, slot_date: rescheduleDate } : null,
    );
  }

  function buildMessage(booking: Booking) {
    const template = profile?.msg_template ?? "";
    const address = buildAddress(booking);
    const horario =
      booking.shift === "especifico" && booking.start_time && booking.end_time
        ? `${booking.start_time.slice(0, 5)} às ${booking.end_time.slice(0, 5)}`
        : "";

    const schedule = booking.shift ? SHIFT_LABEL[booking.shift] : "";
    const valor = ""; // será preenchido quando tiver preço no booking

    return template
      .replace(/{cliente}/g, booking.client_name)
      .replace(/{espaco}/g, booking.venue_name)
      .replace(/{endereco}/g, address)
      .replace(
        /{data}/g,
        booking.slot_date ? formatDate(booking.slot_date) : "",
      )
      .replace(/{turno}/g, schedule)
      .replace(/{horario}/g, horario)
      .replace(/{valor}/g, valor)
      .replace(/{pix}/g, profile?.pix_key ?? "");
  }

  async function handleCopy() {
    if (!selected) return;
    const msg = buildMessage(selected);
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      const el = document.createElement("textarea");
      el.value = msg;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Agendamentos</h2>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-orange-300"
              }`}
            >
              {f === "all" ? "Todos" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Nenhum agendamento encontrado.
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
                    Turno
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium">
                        {booking.client_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {booking.client_phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {booking.venue_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {booking.slot_date ? formatDate(booking.slot_date) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {booking.shift ? SHIFT_LABEL[booking.shift] : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_CLASS[booking.status]}`}
                      >
                        {STATUS_LABEL[booking.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetail(booking)}
                        className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal detalhe */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Agendamento</h3>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Dados do cliente */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.client_name}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Telefone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.client_phone}
                  </p>
                </div>
                {selected.client_email && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selected.client_email}
                    </p>
                  </div>
                )}
              </div>

              {/* Dados do evento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Espaço</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.venue_name}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Data</p>
                  {editingDate ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"
                      />
                      <button
                        onClick={handleReschedule}
                        disabled={saving}
                        className="text-orange-500 hover:text-orange-600"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setEditingDate(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {selected.slot_date
                          ? formatDate(selected.slot_date)
                          : "-"}
                      </p>
                      <button
                        onClick={() => setEditingDate(true)}
                        className="text-gray-400 hover:text-orange-500 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Turno</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.shift ? SHIFT_LABEL[selected.shift] : "-"}
                  </p>
                </div>
                {selected.shift === "especifico" && selected.start_time && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Horário</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selected.start_time.slice(0, 5)} às{" "}
                      {selected.end_time?.slice(0, 5)}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Tipo de festa</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.party_type}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-lg ${STATUS_CLASS[selected.status]}`}
                  >
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>
                {selected.notes && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">
                      Obs do cliente
                    </p>
                    <p className="text-sm text-gray-900">{selected.notes}</p>
                  </div>
                )}
              </div>

              {/* Obs do dono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anotações internas
                </label>
                <textarea
                  value={ownerNotes}
                  onChange={(e) => setOwnerNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Anotações visíveis só para você..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Salvo automaticamente ao sair do campo.
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatus("rejected")}
                  disabled={saving || selected.status === "rejected"}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <X size={14} />
                  Recusar
                </button>
                <button
                  onClick={() => handleStatus("approved")}
                  disabled={saving || selected.status === "approved"}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Check size={14} />
                  Aprovar
                </button>
              </div>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 border-2 border-orange-400 text-orange-500 hover:bg-orange-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                <Copy size={14} />
                {copied ? "Copiado!" : "Copiar mensagem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
