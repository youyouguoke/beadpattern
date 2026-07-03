import PatternArchive from "@/components/archive/PatternArchive";

export default function CollectionPage({ params }: { params: { slug: string } }) {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-8 pt-28">
        <PatternArchive collectionSlug={params.slug} />
      </div>
    </main>
  );
}
