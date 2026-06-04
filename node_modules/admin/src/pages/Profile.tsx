import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Save } from "lucide-react";

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

export default function Profile() {
  const { user } = useAuth();

  const [whatsapp, setWhatsapp] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [msgTemplate, setMsgTemplate] = useState(DEFAULT_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("whatsapp, pix_key, msg_template")
        .eq("id", user!.id)
        .single();
      if (data) {
        setWhatsapp(data.whatsapp ?? "");
        setPixKey(data.pix_key ?? "");
        setMsgTemplate(data.msg_template ?? DEFAULT_TEMPLATE);
      }
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

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
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
