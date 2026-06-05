import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { X, ChevronDown, ChevronUp } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  created_at: string;
};

type ClientGroup = {
  cpf: string | null;
  clients: Client[];
  name: string;
  phone: string;
  email: string | null;
};

type Booking = {
  id: string;
  client_id: string;
  slot_date: string | null;
  shift: string | null;
  party_type: string;
  status: string;
  venue_name: string;
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

function formatCpf(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClientGroup | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("clients")
        .select("id, name, phone, email, cpf, created_at")
        .order("name");
      setClients(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Agrupa por CPF
  function groupClients(clients: Client[]): ClientGroup[] {
    const map = new Map<string, ClientGroup>();

    for (const client of clients) {
      const key = client.cpf ?? `no-cpf-${client.id}`;
      if (map.has(key)) {
        map.get(key)!.clients.push(client);
      } else {
        map.set(key, {
          cpf: client.cpf,
          clients: [client],
          name: client.name,
          phone: client.phone,
          email: client.email,
        });
      }
    }

    return Array.from(map.values());
  }

  async function openGroup(group: ClientGroup) {
    setSelected(group);
    setLoadingBookings(true);
    const clientIds = group.clients.map((c) => c.id);
    const { data } = await supabase
      .from("admin_bookings")
      .select("id, client_id, slot_date, shift, party_type, status, venue_name")
      .filter("client_id", "in", `(${clientIds.join(",")})`)
      .order("slot_date", { ascending: false });
    setBookings(data ?? []);
    setLoadingBookings(false);
  }

  const groups = groupClients(clients).filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) ||
      (g.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.cpf ?? "").includes(search.replace(/\D/g, "")),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone, CPF ou e-mail"
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors w-full md:w-72"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {groups.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {groups.map((group, i) => {
                const key = group.cpf ?? `no-cpf-${i}`;
                const isExpanded = expanded === key;
                const hasMultiple = group.clients.length > 1;

                return (
                  <div key={key}>
                    <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {group.name}
                          </p>
                          {hasMultiple && (
                            <span className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-lg font-medium">
                              {group.clients.length}x
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{group.phone}</p>
                        {group.cpf && (
                          <p className="text-xs text-gray-400">
                            {formatCpf(group.cpf)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openGroup(group)}
                          className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                        >
                          Ver histórico
                        </button>
                        {hasMultiple && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : key)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Registros duplicados */}
                    {isExpanded && hasMultiple && (
                      <div className="bg-gray-50 px-6 pb-3 flex flex-col gap-1">
                        <p className="text-xs text-gray-400 mb-2">
                          Registros com o mesmo CPF:
                        </p>
                        {group.clients.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between text-xs text-gray-500 py-1 border-b border-gray-100 last:border-0"
                          >
                            <span>{c.name}</span>
                            <span className="text-gray-400">
                              {formatDate(c.created_at.slice(0, 10))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal histórico */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.phone}
                  {selected.cpf ? ` · ${formatCpf(selected.cpf)}` : ""}
                  {selected.email ? ` · ${selected.email}` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Histórico de agendamentos
              </p>

              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  Nenhum agendamento encontrado.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
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
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_CLASS[booking.status]}`}
                        >
                          {STATUS_LABEL[booking.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {booking.party_type}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
