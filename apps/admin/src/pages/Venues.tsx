import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  PlusCircle,
  X,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import * as LucideIcons from "lucide-react";

type Venue = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  photos: string[] | null;
  active: boolean;
  capacity: number | null;
  min_gap_hours: number | null;
  min_advance_hours: number | null;
};

type Amenity = { id: string; name: string; icon: string };
type ModalType = "create" | "edit" | null;

function DynamicIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export default function Venues() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Venue | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [capacity, setCapacity] = useState("");
  const [minGapHours, setMinGapHours] = useState("1");
  const [minAdvanceHours, setMinAdvanceHours] = useState("24");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  function resetForm() {
    setName("");
    setDescription("");
    setCep("");
    setAddress("");
    setNumber("");
    setDistrict("");
    setCity("");
    setState("");
    setPhotos([]);
    setCapacity("");
    setMinGapHours("1");
    setMinAdvanceHours("24");
    setSelectedAmenities([]);
    setError(null);
  }

  async function fetchCep(digits: string) {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado.");
        return;
      }
      setAddress(data.logradouro ?? "");
      setDistrict(data.bairro ?? "");
      setCity(data.localidade ?? "");
      setState(data.uf ?? "");
      setError(null);
    } catch {
      setError("Erro ao buscar CEP.");
    }
  }

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [venuesRes, amenitiesRes] = await Promise.all([
        supabase
          .from("venues")
          .select(
            "id, name, description, cep, address, number, district, city, state, active, photos, capacity, min_gap_hours, min_advance_hours",
          )
          .eq("owner_id", user!.id)
          .order("name"),
        supabase
          .from("amenities")
          .select("id, name, icon")
          .eq("owner_id", user!.id)
          .order("name"),
      ]);
      setVenues(venuesRes.data ?? []);
      setAmenities(amenitiesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function fetchVenues() {
    const { data } = await supabase
      .from("venues")
      .select(
        "id, name, description, cep, address, number, district, city, state, active, photos, capacity, min_gap_hours, min_advance_hours",
      )
      .eq("owner_id", user!.id)
      .order("name");
    setVenues(data ?? []);
  }

  async function fetchVenueAmenities(venueId: string) {
    const { data } = await supabase
      .from("venue_amenities")
      .select("amenity_id")
      .eq("venue_id", venueId);
    return (data ?? []).map((r) => r.amenity_id as string);
  }

  function openCreate() {
    resetForm();
    setSelected(null);
    setModal("create");
  }

  async function openEdit(venue: Venue) {
    setName(venue.name);
    setDescription(venue.description ?? "");
    setCep(venue.cep ? venue.cep.replace(/^(\d{5})(\d)/, "$1-$2") : "");
    setAddress(venue.address ?? "");
    setNumber(venue.number ?? "");
    setDistrict(venue.district ?? "");
    setCity(venue.city ?? "");
    setState(venue.state ?? "");
    setPhotos(venue.photos ?? []);
    setCapacity(venue.capacity?.toString() ?? "");
    setMinGapHours(venue.min_gap_hours?.toString() ?? "1");
    setMinAdvanceHours(venue.min_advance_hours?.toString() ?? "24");
    const amenityIds = await fetchVenueAmenities(venue.id);
    setSelectedAmenities(amenityIds);
    setError(null);
    setSelected(venue);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setError(null);
  }

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function getPayload() {
    return {
      name,
      description: description || null,
      address: address || null,
      number: number || null,
      district: district || null,
      city: city || null,
      state: state || null,
      cep: cep.replace(/\D/g, "") || null,
      photos: photos.length > 0 ? photos : null,
      capacity: capacity ? parseInt(capacity) : null,
      min_gap_hours: parseInt(minGapHours) || 1,
      min_advance_hours: parseInt(minAdvanceHours) || 24,
    };
  }

  async function saveAmenities(venueId: string) {
    await supabase.from("venue_amenities").delete().eq("venue_id", venueId);
    if (selectedAmenities.length > 0) {
      await supabase.from("venue_amenities").insert(
        selectedAmenities.map((id) => ({
          venue_id: venueId,
          amenity_id: id,
        })),
      );
    }
  }

  async function handleCreate() {
    if (!name || !city) {
      setError("Nome e cidade são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("venues")
        .insert({ owner_id: user!.id, ...getPayload() })
        .select("id")
        .single();
      if (error) throw error;
      await saveAmenities(data.id);
      closeModal();
      fetchVenues();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar espaço.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!name || !city) {
      setError("Nome e cidade são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("venues")
        .update(getPayload())
        .eq("id", selected!.id);
      if (error) throw error;
      await saveAmenities(selected!.id);
      closeModal();
      fetchVenues();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao editar espaço.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(venue: Venue) {
    await supabase
      .from("venues")
      .update({ active: !venue.active })
      .eq("id", venue.id);
    fetchVenues();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${selected?.id ?? "new"}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("venue-photos")
        .upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage
        .from("venue-photos")
        .getPublicUrl(fileName);
      setPhotos((prev) => [...prev, data.publicUrl]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoDelete(url: string) {
    const fileName = url.split("/").pop()!;
    await supabase.storage.from("venue-photos").remove([fileName]);
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  const formFields = (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome <span className="text-orange-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do espaço"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CEP
        </label>
        <input
          type="text"
          value={cep}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
            const formatted = digits.replace(/^(\d{5})(\d)/, "$1-$2");
            setCep(formatted);
            if (digits.length === 8) fetchCep(digits);
          }}
          placeholder="00000-000"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cidade <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="UF"
            maxLength={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rua
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nome da rua"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número
          </label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Nº"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bairro
        </label>
        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="Bairro"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição{" "}
          <span className="text-gray-400 text-xs font-normal">(opcional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o espaço..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacidade
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Pessoas"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervalo (hrs)
          </label>
          <input
            type="number"
            value={minGapHours}
            onChange={(e) => setMinGapHours(e.target.value)}
            min="1"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Antecedência (hrs)
          </label>
          <input
            type="number"
            value={minAdvanceHours}
            onChange={(e) => setMinAdvanceHours(e.target.value)}
            min="1"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
      </div>

      {amenities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comodidades
          </label>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <button
                key={amenity.id}
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                  selectedAmenities.includes(amenity.id)
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-500 hover:border-orange-300"
                }`}
              >
                <DynamicIcon name={amenity.icon} size={14} />
                {amenity.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fotos
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {photos.map((url) => (
            <div
              key={url}
              className="relative w-20 h-20 rounded-xl overflow-hidden group"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handlePhotoDelete(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}
        </div>
        <label
          className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-orange-400 rounded-xl py-3 cursor-pointer transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <ImagePlus size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">
            {uploading ? "Enviando..." : "Adicionar foto"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Meus Espaços</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          Novo espaço
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {venues.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Nenhum espaço cadastrado ainda.
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                        Nome
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                        Endereço
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                        Capacidade
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                        Fotos
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">
                        Status
                      </th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {venues.map((venue) => (
                      <tr
                        key={venue.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {venue.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {[
                            venue.address,
                            venue.number,
                            venue.district,
                            venue.city,
                            venue.state,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {venue.capacity ? `${venue.capacity} pessoas` : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {venue.photos?.slice(0, 3).map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ))}
                            {(venue.photos?.length ?? 0) === 0 && (
                              <span className="text-xs text-gray-300">
                                Sem fotos
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg ${venue.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                          >
                            {venue.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openEdit(venue)}
                              className="text-gray-400 hover:text-orange-500 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(venue)}
                              className={`transition-colors ${venue.active ? "text-green-500 hover:text-gray-400" : "text-gray-400 hover:text-green-500"}`}
                            >
                              {venue.active ? (
                                <ToggleRight size={18} />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-50">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="px-4 py-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {venue.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {[venue.city, venue.state].filter(Boolean).join(", ")}
                      </p>
                      {venue.capacity && (
                        <p className="text-xs text-gray-400">
                          {venue.capacity} pessoas
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-lg ${venue.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {venue.active ? "Ativo" : "Inativo"}
                      </span>
                      <button
                        onClick={() => openEdit(venue)}
                        className="text-gray-400 hover:text-orange-500 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(venue)}
                        className={`transition-colors ${venue.active ? "text-green-500 hover:text-gray-400" : "text-gray-400 hover:text-green-500"}`}
                      >
                        {venue.active ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">
                {modal === "create" ? "Novo espaço" : "Editar espaço"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            {formFields}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={modal === "create" ? handleCreate : handleEdit}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                {saving
                  ? "Salvando..."
                  : modal === "create"
                    ? "Criar espaço"
                    : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
