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
  { name: "Kawaii Chibi", icon: "sentiment_very_satisfied" },
  { name: "Pixel Art", icon: "grid_on" },
  { name: "Minimalist", icon: "minimize" },
  { name: "Realistic", icon: "photo_camera" },
];

const sizeOptions = ["16x16", "24x24", "32x32", "48x48", "64x64"];
const formatOptions = ["Perler Beads", "Artkal Beads", "Hama Beads", "Cross Stitch"];

export default function BeadPatternGenerator() {
  const [activeTab, setActiveTab] = useState("Prompt");
  const [prompt, setPrompt] = useState("cute frog drinking bubble tea");
  const [selectedSize, setSelectedSize] = useState("32x32");
  const [selectedStyle, setSelectedStyle] = useState("Kawaii Chibi");
  const [selectedPalette, setSelectedPalette] = useState(paletteOptions[0]);
  const [selectedFormat, setSelectedFormat] = useState("Perler Beads");
  const [paletteCount, setPaletteCount] = useState(12);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="font-display-lg text-display-lg-mobile text-primary mb-2">AI Bead Pattern Generator</h1>
          <p className="text-secondary font-body-md">Create beautiful bead patterns from any idea in seconds.</p>
        </div>

        <div className="bg-surface-container rounded-xl p-2 flex gap-1">
          {["Prompt", "Gallery"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg font-label-sm transition-colors ${
                activeTab === tab ? "bg-primary text-white" : "text-secondary hover:bg-surface-container-high"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Prompt" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-secondary-container shadow-sm space-y-3">
              <label className="font-label-sm text-on-surface">What should we create?</label>
              <textarea
                className="w-full h-24 p-3 rounded-lg bg-surface-container-low border-2 border-secondary-container focus:border-primary outline-none resize-none font-body-md"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., cute frog drinking bubble tea..."
              />
              <div className="flex gap-2 flex-wrap">
                {["cute cat", "pixel heart", "space rocket", "kawaii sushi"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="px-3 py-1 rounded-full bg-surface-container text-secondary text-label-sm hover:bg-primary-container hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-secondary-container shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-on-surface">Grid Size</label>
                <span className="text-primary font-label-sm">{selectedSize}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 rounded-lg font-label-sm transition-colors ${
                      selectedSize === size
                        ? "bg-primary text-white"
                        : "bg-surface-container text-secondary hover:bg-secondary-container"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-secondary-container shadow-sm space-y-3">
              <label className="font-label-sm text-on-surface">Art Style</label>
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => setSelectedStyle(style.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-label-sm transition-colors ${
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

            <div className="bg-white rounded-xl p-5 border border-secondary-container shadow-sm space-y-3">
              <label className="font-label-sm text-on-surface">Color Palette</label>
              <div className="space-y-2">
                {paletteOptions.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => setSelectedPalette(palette)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selectedPalette.name === palette.name
                        ? "border-primary bg-primary-fixed"
                        : "border-transparent bg-surface-container hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="flex -space-x-2">
                      {palette.colors.map((c) => (
                        <div key={c} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="font-label-sm text-on-surface">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-secondary-container shadow-sm space-y-4">
              <label className="font-label-sm text-on-surface">Bead Format</label>
              <div className="grid grid-cols-2 gap-2">
                {formatOptions.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-3 py-2 rounded-lg font-label-sm transition-colors ${
                      selectedFormat === fmt
                        ? "bg-primary text-white"
                        : "bg-surface-container text-secondary hover:bg-secondary-container"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-on-surface">Palette Colors</label>
                  <span className="text-primary font-label-sm">{paletteCount}</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={32}
                  value={paletteCount}
                  onChange={(e) => setPaletteCount(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-primary text-white py-4 rounded-xl font-headline-md text-body-md flex items-center justify-center gap-2 hover:bg-primary-container disabled:opacity-60 transition-colors"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {isGenerating ? "Dreaming up beads..." : "Generate Pattern"}
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-secondary-container h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-headline-md text-headline-md">Preview</h2>
              <p className="text-secondary font-body-md">
                {selectedFormat} &bull; {selectedSize} &bull; {selectedStyle}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-surface-container hover:bg-secondary-container text-secondary transition-colors">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button className="p-2 rounded-lg bg-surface-container hover:bg-secondary-container text-secondary transition-colors">
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <button className="p-2 rounded-lg bg-surface-container hover:bg-secondary-container text-secondary transition-colors">
                <span className="material-symbols-outlined">fullscreen</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-surface-container-low rounded-xl border-2 border-dashed border-secondary flex items-center justify-center p-8 overflow-auto">
            {!generated && !isGenerating && (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-5xl text-primary">auto_awesome</span>
                </div>
                <p className="text-secondary font-body-lg">Enter a prompt and click Generate to see your pattern</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-primary font-label-sm">AI is mapping your bead grid...</p>
              </div>
            )}

            {generated && !isGenerating && (
              <div className="w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                  <div className="bg-white rounded-xl p-4 border border-secondary-container">
                    <p className="text-secondary mb-1">Prompt</p>
                    <p className="text-primary font-headline-md italic">{prompt}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-secondary-container">
                    <p className="text-secondary mb-1">Pattern</p>
                    <p className="text-primary font-headline-md">{selectedSize} Grid</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-secondary-container">
                    <p className="text-secondary mb-1">PDF</p>
                    <p className="text-primary font-headline-md">Ready to Print</p>
                  </div>
                </div>
                <div className="bead-grid p-4 rounded-xl bg-white">
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
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-primary text-white py-3 rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined">file_download</span> Download PDF
              </button>
              <button className="flex-1 bg-secondary-container text-primary py-3 rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                <span className="material-symbols-outlined">share</span> Share Pattern
              </button>
              <button className="flex-1 bg-surface-container text-secondary py-3 rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined">edit</span> Edit Grid
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
