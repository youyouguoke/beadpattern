"use client";

import Link from "next/link";
import { useState } from "react";

interface TodayPattern {
  title: string;
  slug: string;
  emoji: string;
  img: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

const todayPatterns: TodayPattern[] = [
  { title: "Cute Frog", slug: "cute-frog", emoji: "🐸", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ", difficulty: "Easy" },
  { title: "Ghost Pattern", slug: "ghost-pattern", emoji: "👻", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE", difficulty: "Easy" },
  { title: "Kawaii Cat", slug: "kawaii-cat", emoji: "🐱", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoB35YtssNgeEtVQIX9I1WEk90aEVlmll9NmIITg8ow7ynWIsHRD3d9YegPvDM7pOWBEMqszJr4-yqlrTrVVTQjJ9fq8ciKbL4GFeJ_ctUC7IwFbOjt9QWVTltQfpnSKbF3t7h39EHtkmVUdK1mSe5r9OwKpkAJVpohIH3mtlJkA5myETC55EmqPq9otyDhNmETrqi9CqSzxHn7X3eUBytBF8Mkzk_b8vKKrCGJ0tJXaqZFv7-gyNfhcZh5eumAcCIQjoYxaZt1oI", difficulty: "Easy" },
  { title: "Bubble Tea Duck", slug: "bubble-tea-duck", emoji: "🦆", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg", difficulty: "Easy" },
  { title: "Christmas Penguin", slug: "christmas-penguin", emoji: "🐧", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBkHrHyo-iAUDP9j17ESnZwHiue-w3UYSdio8GicjGI6ExmTQWasc2BGXVGrrJfhXNE0LOFx8uo07VJ6Z1zGg0UguT7gpVl4n8kJJJznr0jrPGPeBoe3Q8OjgtGCj-daUM3rmdLOSVEHLlx3xYxt6RQWO3xAV12OUxnVYO0nU_LIdjve6SdrGkVAnPOFgW79aOQV7cbmaUT4LfeToUp4RNIdp1eJvMtB9KnVZsFlujuYoxjkVGLDENjaIk537Z2lNboXGGeeOnPqw", difficulty: "Medium" },
  { title: "Halloween", slug: "halloween", emoji: "🎃", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5A0OAvFhb371dF5UerEYoZrRWEfRXI7SONqpJ-zlCobtkbC8dUqLbIlzkChbYjkvDBsnUMnhLEUmok0EbpEwUlUN7R1dNnYQYnBctrz6Khii3QTN5sUTuCVDGl7Hr9rRmRrvK1T5ESSVtqX4mbhjbnmn68EC_alysazpGDInbYeifx7YYUoTJ5d8BJLodWET9zsnR9bmncIYZa602IPEi3Dq1xbo_ZrKZFdPXQGlsy2v2MRdfUXlND3xFLF1LTBRKg-6g5_khrg", difficulty: "Easy" },
  { title: "Strawberry Bear", slug: "strawberry-bear", emoji: "🐻", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlponKu8fvQ9RawvPCBHNOC_O6vluHp3x_PgyanO_QfJGmpnJMsHW8n0jFGy-QF1NcZRqv2-S0fKRBC9ZOcntzHEDQhfTJ7Ns8lFxLFOVTl-jkX5f7i6g49aUs0_S9cOx_953VCppCwoNe_z1wOn72pVFApNPA544CAM_opu5eczuADofDRsX-pZSlVtEwDkIBe8TP8LdXeRWk7AkqGcVh7J65PiFKyA2nVyQPcMvvo3nddOihT4LjDJHAhzIX9omrKZP9fYRixbw", difficulty: "Easy" },
  { title: "Panda Ramen", slug: "panda-ramen", emoji: "🐼", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238", difficulty: "Medium" },
];

function diffColor(diff: TodayPattern["difficulty"]) {
  switch (diff) {
    case "Easy": return "bg-tertiary-container text-white";
    case "Medium": return "bg-secondary-container text-on-secondary-container";
    case "Hard": return "bg-error-container text-on-error-container";
  }
}

export default function DiscoverToday() {
  return (
    <section className="px-4 md:px-12 py-16 bg-surface-container-low">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">🔥 Trending Today</h2>
          <p className="text-secondary text-sm mt-1">Latest AI-generated patterns from our community</p>
        </div>
        <Link href="#trending" className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {todayPatterns.map((p, i) => (
          <Link key={i} href={`/pattern/${p.slug}?tab=finished-photo`} className="group">
            <div className="bg-white rounded-xl bead-shadow overflow-hidden transition-all hover:-translate-y-1">
              <div className="aspect-square overflow-hidden bg-secondary-container relative">
                <img className="w-full h-full object-cover" alt={p.title} src={p.img} />
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${diffColor(p.difficulty)}`}>
                    {p.difficulty}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-label-sm text-center truncate">
                  <span className="mr-1">{p.emoji}</span>{p.title}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
