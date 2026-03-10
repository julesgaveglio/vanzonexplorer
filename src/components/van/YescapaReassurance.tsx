export default function YescapaReassurance() {
  return (
    <div
      className="glass-card p-5 border-l-4"
      style={{ borderLeftColor: "#E8436C" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(232, 67, 108, 0.10)" }}
        >
          🛡️
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">
            Pourquoi la réservation se fait sur Yescapa ?
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Yescapa est la plateforme de location entre particuliers leader en France.
            En passant par eux, vous bénéficiez automatiquement d&apos;une{" "}
            <strong className="text-slate-700">assurance tous risques</strong> pour
            toute la durée de votre séjour — un vrai filet de sécurité pour vous
            comme pour nous. Le paiement et le contrat sont également sécurisés
            par leur plateforme.
          </p>
        </div>
      </div>
    </div>
  );
}
