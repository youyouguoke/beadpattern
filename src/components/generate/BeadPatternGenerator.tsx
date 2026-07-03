"use client";

import { useState } from "react";

const paletteOptions = [
  { name: "Pastel Dream", colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff"] },
  { name: "Candy Pop", colors: ["#ff6b81", "#ff8e72", "#ffd93d", "#6bcb77", "#4d96ff"] },
  { name: "Forest Mood", colors: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"] },
  { name: "Kawaii Classic", colors: ["#ff9ff3", "#feca57", "#ff6b6b", "#48dbfb", "#1dd1a1"] },
  { name: "Retro Vapor", colors: ["#f368e0", "#00d2d3", "#5f27cd", "#ff9f43", "#10ac84"] },
];

const styleOptions = [
  { name: "Classic", icon: "brush" },
  { name: "Modern", icon: "grid_view" },
  { name: "Abstract", icon: "category" },
];

const sizeOptions = ["24x24", "48x48", "64x64"];
const colorCountOptions = ["4-6", "8-12", "16+"];

const historyItems = [
  { title: "Vibrant Macaw", size: "48x48", colors: 12, tier: "Free" },
  { title: "Sakura Branch", size: "32x32", colors: 6, tier: "Pro" },
  { title: "Retro Geometry", size: "64x64", colors: 8, tier: "Free" },
  { title: "Sleepy Tabby", size: "24x24", colors: 5, tier: "Free" },
];

export default function BeadPatternGenerator() {
  const [prompt, setPrompt] = useState("cute frog drinking bubble tea");
  const [selectedSize, setSelectedSize] = useState("32x32");
  const [selectedStyle, setSelectedStyle] = useState("Classic");
  const [selectedPalette, setSelectedPalette] = useState(paletteOptions[0]);
  const [colorCount, setColorCount] = useState("8-12");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const beadGridColors = [
    ["#f4fafd", "#f4fafd", "#74c69d", "#74c69d", "#74c69d", "#74c69d", "#f4fafd", "#f4fafd"],
    ["#f4fafd", "#74c69d", "#52b788", "#52b788", "#52b788", "#52b788", "#74c69d", "#f4fafd"],
    ["#74c69d", "#52b788", "#ffffff", "#161d1f", "#161d1f", "#ffffff", "#52b788", "#74c69d"],
    ["#74c69d", "#52b788", "#ffffff", "#161d1f", "#48dbfb", "#ffffff", "#52b788", "#74c69d"],
    ["#74c69d", "#52b788", "#52b788", "#ffffff", "#48dbfb", "#52b788", "#52b788", "#74c69d"],
    ["#f4fafd", "#74c69d", "#52b788", "#52b788", "#52b788", "#52b788", "#74c69d", "#f4fafd"],
    ["#f4fafd", "#f4fafd", "#74c69d", "#74c69d", "#74c69d", "#74c69d", "#f4fafd", "#f4fafd"],
    ["#f4fafd", "#f4fafd", "#f4fafd", "#74c69d", "#74c69d", "#f4fafd", "#f4fafd", "#f4fafd"],
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="p-4 bg-secondary-container/50 rounded-xl flex items-center gap-3 text-sm text-primary"
        >
          <span className="material-symbols-outlined">info</span>
          We first search existing patterns before creating a new one.
        </div>

        <div>
          <h1 className="font-display-lg text-display-lg-mobile text-primary mb-2">Design Your Vision</h1>
          <p className="text-secondary font-body-md">Describe your pattern or upload a reference. AI will handle the bead-by-bead layout.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-secondary-container shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Pattern Prompt</label>
            <textarea
              className="w-full h-28 p-4 rounded-xl bg-surface-container-low border-2 border-secondary-container focus:border-primary outline-none resize-none font-body-md"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., cute frog drinking bubble tea..."
            />
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Grid Size</label>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl font-label-sm transition-colors ${
                    selectedSize === size
                      ? "bg-primary text-white"
                      : "bg-surface-container text-secondary hover:bg-secondary-container"
                  }`}
                >
                  {size}
                </button>
              ))}
              <button className="py-3 rounded-xl bg-surface-container text-secondary hover:bg-secondary-container font-label-sm">
                Custom...
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Color Count</label>
            <div className="grid grid-cols-3 gap-2">
              {colorCountOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setColorCount(c)}
                  className={`py-3 rounded-xl font-label-sm transition-colors ${
                    colorCount === c
                      ? "bg-primary text-white"
                      : "bg-surface-container text-secondary hover:bg-secondary-container"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-label-sm text-on-surface">Visual Style</label>
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style.name}
                  onClick={() => setSelectedStyle(style.name)}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-label-sm transition-colors ${
                    selectedStyle === style.name
                      ? "bg-primary text-white"
                      : "bg-surface-container text-secondary hover:bg-secondary-container"
                  }`}
                >
                  <span className="material-symbols-outlined">{style.icon}</span>
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-primary text-white py-4 rounded-xl font-headline-md text-body-md flex items-center justify-center gap-2 hover:bg-primary-container disabled:opacity-60 transition-colors"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            {isGenerating ? "Drafting your pattern..." : "Generate Pattern"}
          </button>

          <p className="text-center text-sm text-secondary">Free 3 AI generations daily</p>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-secondary-container h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-headline-md text-headline-md">AI Preview</h2>
              <p className="text-secondary font-body-md">
                {selectedStyle} &bull; {selectedSize} &bull; {selectedPalette.name}
              </p>
            </div>
          </div>

          <div className="flex-1 bg-surface-container-low rounded-2xl border-2 border-dashed border-secondary flex items-center justify-center p-8 overflow-auto">
            {!generated && !isGenerating && (
              <div className="text-center space-y-4 max-w-md">
                <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-5xl text-primary">auto_awesome</span>
                </div>
                <p className="text-on-surface font-headline-md">Ready to Create?</p>
                <p className="text-secondary font-body-md">
                  Enter a prompt on the left and see your bead pattern appear here. Every design is unique and optimized for real-world beading.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-primary font-label-sm">Drafting your pattern...</p>
                <p className="text-secondary text-sm">Calculating color palettes and grid placement</p>
              </div>
            )}

            {generated && !isGenerating && (
              <div className="w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                  <div className="bg-surface-container rounded-xl p-4 border border-secondary-container">
                    <p className="text-secondary mb-1">Prompt</p>
                    <p className="text-primary font-headline-md italic">{prompt}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-4 border border-secondary-container">
                    <p className="text-secondary mb-1">Pattern</p>
                    <p className="text-primary font-headline-md">{selectedSize} Grid</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-4 border border-secondary-container">
                    <p className="text-secondary mb-1">Status</p>
                    <p className="text-primary font-headline-md">Ready to Print</p>
                  </div>
                </div>
                <div className="bead-grid p-6 rounded-2xl bg-white flex justify-center">
                  <div className="grid grid-cols-8 gap-0.5">
                    {beadGridColors.flat().map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-sm border border-white/30"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {generated && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="bg-primary text-white py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined">file_download</span> Download PDF
              </button>
              <button className="bg-secondary-container text-primary py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                <span className="material-symbols-outlined">palette</span> Edit Palette
              </button>
              <button className="bg-surface-container text-secondary py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined">share</span> Share
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-md text-headline-md">Recently Created by Others</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {historyItems.map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-4 border border-secondary-container flex items-center justify-between">
              <div>
                <p className="font-headline-md text-body-md">{item.title}</p>
                <p className="text-secondary text-sm">{item.size} &bull; {item.colors} colors</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.tier === 'Pro' ? 'bg-primary-container text-white' : 'bg-tertiary-container text-white'}`}>
                {item.tier}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
