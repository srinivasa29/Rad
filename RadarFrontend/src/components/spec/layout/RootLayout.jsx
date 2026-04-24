import ScaffoldCard from '../ScaffoldCard';

export default function RootLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#020617] text-[#e2e8f0]">
      <ScaffoldCard
        name="RootLayout"
        category="Layout & Core Structure"
        description="Scaffold layout wrapper with slot for page content."
      />
      <main className="p-4">{children}</main>
    </div>
  );
}
