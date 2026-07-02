"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Pattern {
  title: string;
  img: string;
  difficulty: "Easy" | "Medium" | "Hard";
  grid: string;
  colors: number;
  downloads: string;
  rating: number;
}

const patterns: Pattern[] = [
  { title: "Cute Frog", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ", difficulty: "Easy", grid: "32x32", colors: 12, downloads: "2.4k", rating: 5 },
  { title: "Kawaii Cat", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoB35YtssNgeEtVQIX9I1WEk90aEVlmll9NmIITg8ow7ynWIsHRD3d9YegPvDM7pOWBEMqszJr4-yqlrTrVVTQjJ9fq8ciKbL4GFeJ_ctUC7IwFbOjt9QWVTltQfpnSKbF3t7h39EHtkmVUdK1mSe5r9OwKpkAJVpohIH3mtlJkA5myETC55EmqPq9otyDhNmETrqi9CqSzxHn7X3eUBytBF8Mkzk_b8vKKrCGJ0tJXaqZFv7-gyNfhcZh5eumAcCIQjoYxaZt1oI", difficulty: "Easy", grid: "24x24", colors: 8, downloads: "1.8k", rating: 4 },
  { title: "Ghost Pattern", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE", difficulty: "Easy", grid: "16x16", colors: 5, downloads: "3.1k", rating: 5 },
  { title: "Panda Ramen", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238", difficulty: "Medium", grid: "48x48", colors: 18, downloads: "920", rating: 4 },
  { title: "Christmas Penguin", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBkHrHyo-iAUDP9j17ESnZwHiue-w3UYSdio8GicjGI6ExmTQWasc2BGXVGrrJfhXNE0LOFx8uo07VJ6Z1zGg0UguT7gpVl4n8kJJJznr0jrPGPeBoe3Q8OjgtGCj-daUM3rmdLOSVEHLlx3xYxt6RQWO3xAV12OUxnVYO0nU_LIdjve6SdrGkVAnPOFgW79aOQV7cbmaUT4LfeToUp4RNIdp1eJvMtB9KnVZsFlujuYoxjkVGLDENjaIk537Z2lNboXGGeeOnPqw", difficulty: "Medium", grid: "32x32", colors: 14, downloads: "1.5k", rating: 5 },
  { title: "Strawberry Bear", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlponKu8fvQ9RawvPCBHNOC_O6vluHp3x_PgyanO_QfJGmpnJMsHW8n0jFGy-QF1NcZRqv2-S0fKRBC9ZOcntzHEDQhfTJ7Ns8lFxLFOVTl-jkX5f7i6g49aUs0_S9cOx_953VCppCwoNe_z1wOn72pVFApNPA544CAM_opu5eczuADofDRsX-pZSlVtEwDkIBe8TP8LdXeRWk7AkqGcVh7J65PiFKyA2nVyQPcMvvo3nddOihT4LjDJHAhzIX9omrKZP9fYRixbw", difficulty: "Easy", grid: "24x24", colors: 9, downloads: "2.1k", rating: 5 },
  { title: "Pixel Bunny", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxoYk69P9StN6wav9jZOzxbN3tooGoa8NBNY6dVjlSqxymcjfGByFd1U5exFJrBUsibmRYhOr2j102EcgExO0BAFk74xnzhq4XkIEx7KfW3KpoEoG2N7e1JcTql3AMAkKYfXhpmJqFoyvLvA1nlugjqTFoz1OG-IzV7z2ZxhzzzNm9IYeZVpQCvqyhVDmqYMBhuP8EyE7WJ0TZ_pwIIpDA_uZw9ZDyctW69HwQVA_TfkjqIbsHKWKoX6lnbDhykWATqbAoZ_RObWs", difficulty: "Medium", grid: "32x32", colors: 11, downloads: "1.3k", rating: 4 },
  { title: "Bubble Tea Duck", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg", difficulty: "Easy", grid: "24x24", colors: 7, downloads: "1.7k", rating: 5 },
];

function difficultyColor(diff: Pattern["difficulty"]) {
  switch (diff) {
    case "Easy": return "bg-tertiary-container text-white";
    case "Medium": return "bg-secondary-container text-on-secondary-container";
    case "Hard": return "bg-error-container text-on-error-container";
    default: return "bg-surface-variant text-on-surface-variant";
  }
}

export default function TrendingPatterns() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="px-4 md:px-12 py-16 bg-surface" id="trending">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Trending Patterns</h2>
          <p className="text-secondary text-sm mt-1">Most downloaded this week</p>
        </div>
        <button className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
      <div className="grid grid-cols-8 gap-4">
        {patterns.map((p, i) => (
          <div
            key={i}
            className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden group"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="aspect-square overflow-hidden bg-secondary-container relative">
              <img className="w-full h-full object-cover" alt={p.title} src={p.img} />
              {hovered === i && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity">
                  <button className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                    <span className="material-symbols-outlined">visibility</span> Quick Preview
                  </button>
                  <Link
                    href={`/pattern/${p.title.toLowerCase().replace(/\s+/g, "-")}?tab=finished-photo`}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined">file_download</span> Download
                  </Link>
                  <button className="bg-secondary-container text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                    <span className="material-symbols-outlined">auto_awesome</span> Generate Similar
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="mb-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${difficultyColor(p.difficulty)}`}>{p.difficulty}</span>
              </div>
              <h3 className="font-headline-md text-body-md mb-1">{p.title}</h3>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wide">
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">{p.grid}</span>
                <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant">{p.colors} Colors</span>
              </div>
              <div className="flex items-center justify-between text-label-sm text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">download</span> {p.downloads}
                </span>
                <Link href={`/pattern/${p.title.toLowerCase().replace(/\s+/g, "-")}`} className="group-hover:text-primary transition-colors">View →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
