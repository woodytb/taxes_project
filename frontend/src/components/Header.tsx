export default function Header() {
  return (
    <header className="bg-navy py-6 px-8 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold tracking-tight">
            Handelsregister Extraktor
          </h1>
          <p className="text-cream/70 text-sm mt-0.5 font-light">
            Automatische Extraktion von Registerdaten aus PDF-Dokumenten
          </p>
        </div>
      </div>
    </header>
  )
}
