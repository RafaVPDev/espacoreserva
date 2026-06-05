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
  guest_count: number | null;
  price: number | null;
  amount_paid: number | null;
  created_at: string;
  venue_id: string;
  client_id: string;
  venue_name: string;
  venue_address: string | null;
  venue_number: string | null;
  venue_district: string | null;
  venue_city: string | null;
  venue_state: string | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  client_cpf: string | null;
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
  finalizado: "Finalizado",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
  finalizado: "bg-purple-50 text-purple-600",
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

function formatCpf(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getShiftHours(
  shift: string,
  startTime: string | null,
  endTime: string | null,
) {
  if (shift === "diurno") return "06:00 às 17:00";
  if (shift === "noturno") return "18:00 às 05:00";
  if (startTime && endTime)
    return `${startTime.slice(0, 5)} às ${endTime.slice(0, 5)}`;
  return "-";
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
  const [filter, setFilter] = useState("open");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [ownerNotes, setOwnerNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [editingShift, setEditingShift] = useState(false);
  const [newShift, setNewShift] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [editingPayment, setEditingPayment] = useState(false);

  useEffect(() => {
    fetchBookings();
    if (user) {
      async function loadProfile() {
        const { data } = await supabase
          .from("profiles")
          .select("pix_key, msg_template, whatsapp")
          .eq("id", user!.id)
          .single();
        setProfile(data);
      }
      loadProfile();
    }
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase.from("admin_bookings").select("*");
    setBookings(data ?? []);
    setLoading(false);
  }

  function openDetail(booking: Booking) {
    setSelected(booking);
    setOwnerNotes(booking.owner_notes ?? "");
    setRescheduleDate(booking.slot_date ?? "");
    setAmountPaid(booking.amount_paid?.toString() ?? "0");
    setNewShift(booking.shift ?? "");
    setNewStart(booking.start_time?.slice(0, 5) ?? "");
    setNewEnd(booking.end_time?.slice(0, 5) ?? "");
    setEditingDate(false);
    setEditingShift(false);
    setEditingPayment(false);
    setCopied(false);
  }

  function closeDetail() {
    setSelected(null);
    setEditingDate(false);
    setEditingShift(false);
    setEditingPayment(false);
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

  async function handleSaveShift() {
    if (!selected || !newShift) return;
    setSaving(true);
    await supabase
      .from("bookings")
      .update({
        shift: newShift,
        start_time: newShift === "especifico" ? newStart : null,
        end_time: newShift === "especifico" ? newEnd : null,
      })
      .eq("id", selected.id);
    setSaving(false);
    setEditingShift(false);
    fetchBookings();
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            shift: newShift,
            start_time: newShift === "especifico" ? newStart : null,
            end_time: newShift === "especifico" ? newEnd : null,
          }
        : null,
    );
  }

  async function handleSavePayment() {
    if (!selected) return;
    const paid = parseFloat(amountPaid.replace(",", ".")) || 0;
    setSaving(true);
    await supabase
      .from("bookings")
      .update({ amount_paid: paid })
      .eq("id", selected.id);
    setSaving(false);
    setEditingPayment(false);
    fetchBookings();
    setSelected((prev) => (prev ? { ...prev, amount_paid: paid } : null));
  }

  function buildMessage(booking: Booking) {
    const template = profile?.msg_template ?? "";
    const address = buildAddress(booking);
    const horario = getShiftHours(
      booking.shift ?? "",
      booking.start_time,
      booking.end_time,
    );
    const schedule = booking.shift ? SHIFT_LABEL[booking.shift] : "";
    const valor = booking.price ? formatPrice(booking.price) : "";

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

  const filtered = bookings.filter((b) => {
    const matchFilter =
      filter === "all"
        ? true
        : filter === "open"
          ? ["pending", "approved"].includes(b.status)
          : filter === "closed"
            ? ["rejected", "finalizado"].includes(b.status)
            : b.status === filter;

    const matchDate =
      filter !== "all"
        ? true
        : (!dateFrom || (b.slot_date ?? "") >= dateFrom) &&
          (!dateTo || (b.slot_date ?? "") <= dateTo);

    return matchFilter && matchDate;
  });

  const isFinalizado = selected?.status === "finalizado";
  const isQuitado =
    selected?.price != null &&
    selected?.amount_paid != null &&
    selected.amount_paid >= selected.price;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Agendamentos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-colors bg-white"
          >
            <optgroup label="Em aberto">
              <option value="open">Em aberto (todos)</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
            </optgroup>
            <optgroup label="Fechado">
              <option value="closed">Fechado (todos)</option>
              <option value="rejected">Recusado</option>
              <option value="finalizado">Finalizado</option>
            </optgroup>
            <option value="all">Todos</option>
          </select>

          {filter === "all" && (
            <>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-colors"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </>
          )}
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
            <>
              {/* Desktop */}
              <div className="hidden md:block">
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
                          {booking.slot_date
                            ? formatDate(booking.slot_date)
                            : "-"}
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
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((booking) => (
                  <div
                    key={booking.id}
                    className="px-4 py-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.client_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {booking.venue_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.slot_date
                          ? formatDate(booking.slot_date)
                          : "-"}
                        {booking.shift
                          ? ` · ${SHIFT_LABEL[booking.shift]}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-lg ${STATUS_CLASS[booking.status]}`}
                      >
                        {STATUS_LABEL[booking.status]}
                      </span>
                      <button
                        onClick={() => openDetail(booking)}
                        className="text-xs text-orange-500 font-medium"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal */}
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
              {/* Cliente */}
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
                {selected.client_cpf && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">CPF</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCpf(selected.client_cpf)}
                    </p>
                  </div>
                )}
                {selected.client_email && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selected.client_email}
                    </p>
                  </div>
                )}
                {selected.guest_count && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Pessoas</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selected.guest_count}
                    </p>
                  </div>
                )}
              </div>

              {/* Evento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Espaço</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.venue_name}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Data</p>
                  {!isFinalizado && editingDate ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-400"
                      />
                      <button
                        onClick={handleReschedule}
                        disabled={saving}
                        className="text-orange-500"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingDate(false)}
                        className="text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {selected.slot_date
                          ? formatDate(selected.slot_date)
                          : "-"}
                      </p>
                      {!isFinalizado && (
                        <button
                          onClick={() => setEditingDate(true)}
                          className="text-gray-400 hover:text-orange-500"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Turno</p>
                  {!isFinalizado && editingShift ? (
                    <div className="flex flex-col gap-2">
                      <select
                        value={newShift}
                        onChange={(e) => setNewShift(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-400 bg-white"
                      >
                        <option value="diurno">Diurno</option>
                        <option value="noturno">Noturno</option>
                        <option value="especifico">Específico</option>
                      </select>
                      {newShift === "especifico" && (
                        <div className="flex gap-1">
                          <input
                            type="time"
                            value={newStart}
                            onChange={(e) => setNewStart(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-400"
                          />
                          <input
                            type="time"
                            value={newEnd}
                            onChange={(e) => setNewEnd(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-400"
                          />
                        </div>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveShift}
                          disabled={saving}
                          className="flex-1 bg-orange-500 text-white text-xs py-1 rounded-lg"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingShift(false)}
                          className="flex-1 border border-gray-200 text-gray-500 text-xs py-1 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {selected.shift ? SHIFT_LABEL[selected.shift] : "-"}
                      </p>
                      {!isFinalizado && (
                        <button
                          onClick={() => setEditingShift(true)}
                          className="text-gray-400 hover:text-orange-500"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Horário</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getShiftHours(
                      selected.shift ?? "",
                      selected.start_time,
                      selected.end_time,
                    )}
                  </p>
                </div>

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

              {/* Pagamento */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Pagamento
                  </p>
                  {isQuitado && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-600">
                      Quitado
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Valor total</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selected.price ? formatPrice(selected.price) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Valor pago</p>
                    {!isFinalizado && editingPayment ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={amountPaid}
                          onChange={(e) =>
                            setAmountPaid(e.target.value.replace(/[^\d,]/g, ""))
                          }
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-400"
                          placeholder="0,00"
                        />
                        <button
                          onClick={handleSavePayment}
                          disabled={saving}
                          className="text-orange-500"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingPayment(false)}
                          className="text-gray-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {selected.amount_paid != null
                            ? formatPrice(selected.amount_paid)
                            : "-"}
                        </p>
                        {!isFinalizado && (
                          <button
                            onClick={() => setEditingPayment(true)}
                            className="text-gray-400 hover:text-orange-500"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão finalizar */}
              {selected.status === "approved" && isQuitado && (
                <div className="flex items-center justify-between bg-purple-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">
                      Pronto para finalizar
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5">
                      Pagamento quitado. Marque como finalizado.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatus("finalizado")}
                    disabled={saving}
                    className="bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    Finalizar
                  </button>
                </div>
              )}

              {/* Anotações - sempre editável */}
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

            <div className="px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white flex flex-col gap-2">
              {!isFinalizado && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatus("rejected")}
                    disabled={saving || selected.status === "rejected"}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 font-medium py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <X size={14} /> Recusar
                  </button>
                  <button
                    onClick={() => handleStatus("approved")}
                    disabled={saving || selected.status === "approved"}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                  >
                    <Check size={14} /> Aprovar
                  </button>
                </div>
              )}
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
