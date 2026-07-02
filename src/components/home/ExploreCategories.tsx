"use client";

const categories = [
  { name: "Animals", icon: "pets", count: 1245, tag: "Popular" },
  { name: "Kawaii", icon: "favorite", count: 892, tag: "Trending" },
  { name: "Halloween", icon: "dark_mode", count: 634, tag: "Seasonal" },
  { name: "Christmas", icon: "ac_unit", count: 521, tag: "Popular" },
  { name: "Food", icon: "bakery_dining", count: 743, tag: "New" },
  { name: "Gaming", icon: "videogame_asset", count: 410, tag: "Trending" },
];

const tagStyles: Record<string, string> = {
  New: "bg-tertiary-container text-white",
  Popular: "bg-primary text-white",
  Trending: "bg-secondary-container text-on-secondary-container",
  Seasonal: "bg-error-container text-on-error-container",
};

export default function ExploreCategories() {
  return (
    <section className="px-4 md:px-12 py-16 bg-surface" id="categories">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Explore Categories</h2>
          <p className="text-secondary text-sm mt-1">Browse thousands of patterns by theme</p>
        </div>
        <button className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
      <div className="grid grid-cols-6 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden group cursor-pointer"
          >
            <div className="aspect-square overflow-hidden bg-secondary-container relative">
              <div className="w-full h-full flex items-center justify-center bg-surface-container">
                <span className="material-symbols-outlined text-6xl text-primary/30">{cat.icon}</span>
              </div>
              <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[cat.tag]}`}>
                {cat.tag}
              </span>
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                <button className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                  <span className="material-symbols-outlined">visibility</span> Browse
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-headline-md text-body-md">{cat.name}</h3>
              </div>
              <div className="flex items-center justify-between text-label-sm text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">deployed_code</span> {cat.count.toLocaleString()}
                </span>
                <span className="group-hover:text-primary transition-colors">View →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
