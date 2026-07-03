import PatternArchive from "@/components/archive/PatternArchive";

export default function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q || "";

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <PatternArchive searchQuery={query} />
      </div>
    </main>
  );
}
