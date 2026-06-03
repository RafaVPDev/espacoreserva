import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle
            className="text-orange-500"
            size={64}
            strokeWidth={1.5}
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Reserva enviada!
        </h1>
        <p className="text-gray-400 text-sm mb-10 leading-relaxed">
          Recebemos seu pedido. Em breve o responsável pelo espaço entrará em
          contato para confirmar sua reserva.
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 rounded-2xl transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </main>
  );
}
