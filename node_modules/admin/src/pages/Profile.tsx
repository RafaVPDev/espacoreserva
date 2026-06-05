import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Save, Plus, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

const DEFAULT_TEMPLATE = `Olá, {cliente}! 🎉

Sua reserva foi confirmada:

📍 Espaço: {espaco}
📍 Endereço: {endereco}
📅 Data: {data}
🕐 Turno: {turno}
💰 Valor: {valor}

Pagamento via PIX:
🔑 Chave: {pix}

Qualquer dúvida, é só chamar!`;

const VARIABLES = [
  { key: "{cliente}", desc: "Nome do cliente" },
  { key: "{espaco}", desc: "Nome do espaço" },
  { key: "{endereco}", desc: "Endereço completo" },
  { key: "{data}", desc: "Data do evento" },
  { key: "{turno}", desc: "Turno selecionado" },
  { key: "{horario}", desc: "Horário (específico)" },
  { key: "{valor}", desc: "Valor do turno" },
  { key: "{pix}", desc: "Chave PIX" },
];

const ICON_OPTIONS = [
  "Flame",
  "Waves",
  "Umbrella",
  "DoorOpen",
  "Music",
  "Wifi",
  "Car",
  "UtensilsCrossed",
  "Baby",
  "Trees",
  "Dumbbell",
  "Tv",
  "Wind",
  "Snowflake",
  "Coffee",
  "Beer",
  "Camera",
  "Star",
  "Shield",
  "Zap",
  "Heart",
  "Home",
  "Users",
  "Sun",
];

type Amenity = {
  id: string;
  name: string;
  icon: string;
};

function DynamicIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export default function Profile() {
  const { user } = useAuth();

  const [whatsapp, setWhatsapp] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [msgTemplate, setMsgTemplate] = useState(DEFAULT_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [newAmenityName, setNewAmenityName] = useState("");
  const [newAmenityIcon, setNewAmenityIcon] = useState("Star");
  const [addingAmenity, setAddingAmenity] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [profileRes, amenitiesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("whatsapp, pix_key, msg_template")
          .eq("id", user!.id)
          .single(),
        supabase
          .from("amenities")
          .select("id, name, icon")
          .eq("owner_id", user!.id)
          .order("name"),
      ]);
      if (profileRes.data) {
        setWhatsapp(profileRes.data.whatsapp ?? "");
        setPixKey(profileRes.data.pix_key ?? "");
        setMsgTemplate(profileRes.data.msg_template ?? DEFAULT_TEMPLATE);
      }
      setAmenities(amenitiesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        whatsapp: whatsapp || null,
        pix_key: pixKey || null,
        msg_template: msgTemplate || null,
      })
      .eq("id", user!.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleAddAmenity() {
    if (!newAmenityName) return;
    setAddingAmenity(true);
    const { data } = await supabase
      .from("amenities")
      .insert({
        owner_id: user!.id,
        name: newAmenityName,
        icon: newAmenityIcon,
      })
      .select("id, name, icon")
      .single();
    if (data)
      setAmenities((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
    setNewAmenityName("");
    setNewAmenityIcon("Star");
    setAddingAmenity(false);
  }

  async function handleDeleteAmenity(id: string) {
    await supabase.from("amenities").delete().eq("id", id);
    setAmenities((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Meu Perfil</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Save size={15} />
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Contato */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Contato</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  const formatted = digits
                    .replace(/^(\d{2})(\d)/, "($1) $2")
                    .replace(/(\d{5})(\d)/, "$1-$2");
                  setWhatsapp(formatted);
                }}
                placeholder="(00) 00000-0000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Comodidades */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Comodidades
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Cadastre aqui e selecione nos seus espaços.
          </p>

          <div className="flex flex-col gap-2 mb-4">
            {amenities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhuma comodidade cadastrada.
              </p>
            ) : (
              amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500">
                      <DynamicIcon name={amenity.icon} size={16} />
                    </div>
                    <span className="text-sm text-gray-900">
                      {amenity.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAmenity(amenity.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Adicionar */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-700 mb-3">
              Nova comodidade
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newAmenityName}
                onChange={(e) => setNewAmenityName(e.target.value)}
                placeholder="Nome da comodidade"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition-colors"
              />

              <div>
                <p className="text-xs text-gray-400 mb-2">Escolha um ícone:</p>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewAmenityIcon(icon)}
                      title={icon}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-colors ${
                        newAmenityIcon === icon
                          ? "border-orange-400 bg-orange-50 text-orange-500"
                          : "border-gray-200 text-gray-400 hover:border-orange-300"
                      }`}
                    >
                      <DynamicIcon name={icon} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddAmenity}
                disabled={addingAmenity || !newAmenityName}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                <Plus size={15} />
                {addingAmenity ? "Adicionando..." : "Adicionar comodidade"}
              </button>
            </div>
          </div>
        </div>

        {/* Template */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Mensagem de confirmação
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Essa mensagem é copiada ao clicar em "Copiar mensagem" nos
            agendamentos.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                onClick={() => setMsgTemplate((t) => t + v.key)}
                title={v.desc}
                className="text-xs px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors font-mono"
              >
                {v.key}
              </button>
            ))}
          </div>
          <textarea
            value={msgTemplate}
            onChange={(e) => setMsgTemplate(e.target.value)}
            rows={12}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-400 transition-colors resize-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}
