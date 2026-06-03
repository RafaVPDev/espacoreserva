import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { UserPlus, X, Pencil, Trash2 } from "lucide-react";

type Owner = {
  id: string;
  full_name: string;
};

type ModalType = "create" | "edit" | "delete" | null;

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Owner | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "venue_owner")
        .order("full_name");
      setOwners(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function fetchOwners() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "venue_owner")
      .order("full_name");
    setOwners(data ?? []);
  }

  function openCreate() {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setSelected(null);
    setModal("create");
  }

  function openEdit(owner: Owner) {
    setName(owner.full_name);
    setError(null);
    setSelected(owner);
    setModal("edit");
  }

  function openDelete(owner: Owner) {
    setSelected(owner);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setError(null);
  }

  async function handleCreate() {
    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ email, password, full_name: name }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      closeModal();
      fetchOwners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar dono.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!name) {
      setError("Preencha o nome.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", selected!.id);
      if (error) throw error;
      closeModal();
      fetchOwners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao editar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: selected!.id }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      closeModal();
      fetchOwners();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Donos de espaço</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <UserPlus size={16} />
          Novo dono
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {owners.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Nenhum dono cadastrado ainda.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                    Nome
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                    ID
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {owner.full_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                      {owner.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(owner)}
                          className="text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openDelete(owner)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal criar */}
      {modal === "create" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Novo dono de espaço
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do responsável"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha de acesso"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving ? "Criando..." : "Criar dono"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {modal === "edit" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar dono</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
              />
              {error && (
                <p className="text-red-500 text-sm text-center mt-3">{error}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal deletar */}
      {modal === "delete" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5">
              <h3 className="font-semibold text-gray-900 mb-2">Excluir dono</h3>
              <p className="text-sm text-gray-500">
                Tem certeza que quer excluir{" "}
                <span className="font-medium text-gray-900">
                  {selected?.full_name}
                </span>
                ? Esta ação não pode ser desfeita.
              </p>
              {error && (
                <p className="text-red-500 text-sm text-center mt-3">{error}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
