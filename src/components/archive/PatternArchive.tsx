"use client";

import { useState } from "react";

const difficulties = [
  { id: "easy", label: "Easy (Beginner)", checked: true },
  { id: "medium", label: "Medium (Intermediate)", checked: true },
  { id: "hard", label: "Hard (Advanced)", checked: false },
];

const categories = ["Animals", "Food & Drink", "Seasonal", "Nature", "Fantasy"];
const sizes = ["Small (Under 30 beads)", "Medium (30-100 beads)", "Large (100+ beads)"];

const patterns = [
  { title: "Blushy Axolotl", difficulty: "Medium", beads: 424, favorite: true, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnkaljqhaPP1Gtxq5hT9ydi9v6CRnmxljIiANmarO3IDC3ce97G4a63RG-nUw9c6SRNFEz9FqvtfZ3RfL9T-rDqOnvGRBPynXrGLbvjCTco--w55fjhmZRWrjJtcBHU9dxXduF8vMVGIw20IVG45-XztHOXBPFPt2pLx4E4VdzDdNt3ntwtuHZKbgVoT-fgkjSsK1de2YRbwarRTGv0QAMs4sUZaFOzIBc21K6QGI4puGuWkaKHAnf8U5UjkoKaiW_iwWftirKNiA" },
  { title: "Sweet Stack", difficulty: "Easy", beads: 150, favorite: false, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrdgIB3yWzHnOzusBfaTrvBdDgcJaOEfrRh_sspg-A0aryjbv5DsZRBWJqDAodFmJ1enCeMWBlfwjaJdKPJd8dCqQhvPp0y9ni3YRDT43tMCIfDftBXb2Gg58BCjWP780H250dKMnPEdzfqomqrUO0_PlrqWoqK0Ln4i3aU0x0jJ5gBde35J5wEoOQl06YbxJ9kAaeAlUaAhwTGcCzu0gx8JJW9je4CKTvA8xX2M9zN8ZHvp03NdqggQKyuZCq-Jl0T-szwGPJBvI" },
  { title: "Bandana Shiba", difficulty: "Hard", beads: 840, favorite: false, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGn3rcCQY8IJz4mgnyPKjW_wHKEteel_1jvEFPLXhg3UZ5uoC9oLG_QBJ_RiIX4HO8hv1g8_32Cy46W-BJgCDBSQ6pi-Quqx3X1nqiTWUR3rd3ALhN8R-TfqGitGGLVEf5ArjjemZ1Sww0GfCZDsHViKHsDE8lMAGf793iAWzXcVUxF_f1vhaOoznvBSJtO92UqRxq3XPcsd0HEIy_RnblwreHh4obOGheWH0bZ7Cg9J2Gv2mXXR85vscUrQbHGYBGirGg3BJLg5M" },
  { title: "Happy Rain", difficulty: "Easy", beads: 98, favorite: false, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtqluRk7o7f4WEk1p8w8Uhsai0qDdEaOkFXWgyXmtC9RtNgZjZ5miUq9HU71SqfcTmLhfsnF-491_FCxN_VEDL7Lkmfuw7BpsfWISxvDq9Psg20whWc9XeoTKkSjCebwjzHH82zhXTDRrEmtDu4cfGAuX7Qhtju4AUCaeG8xv3tO1J0PpkGWtJgJ0BV0EVIxmBt03UY3l3MejMWOC3inVt7GI52_jibvUettUpbDK-nuMeFtRx6Y-w8hJSX2CEs07wdZ3ojKRcxBA" },
];

function difficultyColor(diff: string) {
  switch (diff) {
    case "Easy": return "bg-tertiary-container text-white";
    case "Medium": return "bg-secondary-container text-on-secondary-container";
    case "Hard": return "bg-error-container text-on-error-container";
    default: return "bg-surface-variant text-on-surface-variant";
  }
}

export default function PatternArchive() {
  const [selectedCategory, setSelectedCategory] = useState("Animals");
  const [selectedSize, setSelectedSize] = useState("Medium (30-100 beads)");
  const [selectedDiffs, setSelectedDiffs] = useState<Record<string, boolean>>({ easy: true, medium: true, hard: false });

  const toggleDiff = (id: string) => {
    setSelectedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="text-center md:text-left">
        <div className="max-w-3xl">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">Kawaii Bead Patterns</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 leading-relaxed">
            Step into our cozy crafting corner and browse hundreds of cute printable bead templates. From tiny sushi rolls to sleepy kittens, find your next project here.
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <a href="/generate" className="px-6 py-3 bg-primary-container text-on-primary-container rounded-lg font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md">
              <span className="material-symbols-outlined">auto_awesome</span> Generate AI Pattern
            </a>
            <button className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
              <span className="material-symbols-outlined">bookmark</span> Saved Collections
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="bg-surface-container-low p-6 rounded-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md">Filters</h3>
                <button className="text-label-sm text-primary hover:underline">Clear all</button>
              </div>

              <div className="space-y-4">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Difficulty</p>
                <div className="space-y-2">
                  {difficulties.map((d) => (
                    <label key={d.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedDiffs[d.id]}
                        onChange={() => toggleDiff(d.id)}
                        className="w-5 h-5 rounded border-2 border-secondary text-primary focus:ring-primary"
                      />
                      <span className="text-body-md group-hover:text-primary">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-label-sm transition-colors ${
                        selectedCategory === cat
                          ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                          : "bg-surface-variant text-on-surface-variant hover:bg-primary-fixed"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-label-sm uppercase tracking-wider text-on-surface-variant">Pattern Size</p>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full bg-surface-container-lowest border-2 border-secondary-container rounded-lg p-2 focus:border-primary outline-none"
                >
                  {sizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <nav className="bg-surface-container-low rounded-xl overflow-hidden hidden lg:block">
              <div className="p-4 bg-primary/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                  <span className="material-symbols-outlined text-sm">stars</span>
                </div>
                <div>
                  <p className="font-label-sm text-primary">Pro Tools</p>
                  <p className="text-[10px] text-on-surface-variant">Unlock custom exports</p>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <a href="#" className="flex items-center gap-3 p-2 bg-primary-container text-on-primary-container rounded-lg font-bold">
                  <span className="material-symbols-outlined">grid_view</span>
                  <span className="text-body-md">All Patterns</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all">
                  <span className="material-symbols-outlined">sentiment_satisfied</span>
                  <span className="text-body-md">Beginner</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all">
                  <span className="material-symbols-outlined">sentiment_neutral</span>
                  <span className="text-body-md">Intermediate</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all">
                  <span className="material-symbols-outlined">sentiment_very_dissatisfied</span>
                  <span className="text-body-md">Advanced</span>
                </a>
              </div>
            </nav>
          </div>
        </aside>

        <div className="flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {patterns.map((p, i) => (
              <div key={i} className="group bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                  <img className="w-full h-full object-cover" alt={p.title} src={p.img} />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-primary p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <span className="material-symbols-outlined">file_download</span>
                    </button>
                  </div>
                </div>
                <div className="px-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-headline-md text-body-md text-on-surface truncate">{p.title}</h4>
                    {p.favorite && <span className="material-symbols-outlined text-primary text-sm">favorite</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${difficultyColor(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">{p.beads} Beads</span>
                  </div>
                  <button className="w-full py-2 bg-surface-variant text-on-surface-variant text-label-sm rounded hover:bg-primary hover:text-white transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
