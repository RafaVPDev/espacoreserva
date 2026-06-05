import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Waves,
  Umbrella,
  DoorOpen,
  X,
  Users,
  MessageCircle,
} from "lucide-react";
import { useVenues } from "../hooks/useVenues";
import * as LucideIcons from "lucide-react";

const amenities = [
  { icon: Flame, label: "Churrasqueira" },
  { icon: Waves, label: "Piscina" },
  { icon: Umbrella, label: "Área coberta" },
  { icon: DoorOpen, label: "Banheiros" },
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80";

type Venue = ReturnType<typeof useVenues>["venues"][0];

function DynamicIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export default function Home() {
  const navigate = useNavigate();
  const { venues, loading } = useVenues();
  const [modalVenue, setModalVenue] = useState<Venue | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  function openModal(venue: Venue) {
    setModalVenue(venue);
    setPhotoIndex(0);
  }

  function closeModal() {
    setModalVenue(null);
  }

  function handleWhatsapp(venue: Venue) {
    if (!venue.owner_whatsapp) return;
    const number = venue.owner_whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Poderia me dar mais informações a respeito do Local ${venue.name}?`,
    );
    window.open(`https://wa.me/55${number}?text=${message}`, "_blank");
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1400&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Reserva Aí
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10">
            Espaços para festas. Sem complicação.
          </p>
          <button
            onClick={() =>
              document
                .getElementById("espacos")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium px-8 py-4 rounded-2xl transition-colors"
          >
            Ver espaços disponíveis
          </button>
        </div>
      </section>

      {/* Comodidades */}
      <section className="py-10 px-6 bg-white">
        <p className="text-center text-orange-500 text-sm font-semibold uppercase tracking-widest mb-10">
          Tudo em um só lugar
        </p>
        <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
          {amenities.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl border-2 border-orange-400 flex items-center justify-center">
                <Icon className="text-orange-500" size={28} />
              </div>
              <span className="text-sm text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Espaços */}
      <section id="espacos" className="py-10 px-4 md:px-6 bg-orange-50">
        <p className="text-center text-orange-500 text-sm font-semibold uppercase tracking-widest mb-10">
          Escolha seu espaço
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-orange-400 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative">
                  <img
                    src={venue.photos?.[0] ?? FALLBACK_IMAGE}
                    alt={venue.name}
                    className="w-full h-48 object-cover"
                  />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">
                    {venue.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-1">
                    {[venue.district, venue.city, venue.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  {venue.capacity && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                      <Users size={12} />
                      <span>Até {venue.capacity} pessoas</span>
                    </div>
                  )}

                  {venue.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {venue.amenities.map((amenity) => (
                        <span
                          key={amenity.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-200"
                        >
                          <DynamicIcon name={amenity.icon} size={11} />
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openModal(venue)}
                      className="flex-1 border border-orange-500 text-orange-500 hover:bg-orange-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
                    >
                      Ver fotos
                    </button>
                    <button
                      onClick={() => navigate(`/booking?venue=${venue.id}`)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                    >
                      Ver datas
                    </button>
                  </div>

                  {venue.owner_whatsapp && (
                    <button
                      onClick={() => handleWhatsapp(venue)}
                      className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-400 hover:text-green-500 transition-colors py-1"
                    >
                      <MessageCircle size={14} />
                      Dúvidas? Fale conosco
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de fotos */}
      {modalVenue && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{modalVenue.name}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={modalVenue.photos?.[photoIndex] ?? FALLBACK_IMAGE}
              alt={modalVenue.name}
              className="w-full object-contain max-h-96"
            />
            {(modalVenue.photos?.length ?? 0) > 1 && (
              <div className="flex justify-center gap-2 py-4">
                {modalVenue.photos!.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === photoIndex ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
