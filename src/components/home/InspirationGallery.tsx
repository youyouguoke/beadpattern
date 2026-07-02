"use client";

const images = [
  { alt: "A vertical masonry-style perler bead pattern showing a tall sunflower with a smiling face.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5A0OAvFhb371dF5UerEYoZrRWEfRXI7SONqpJ-zlCobtkbC8dUqLbIlzkChbYjkvDBsnUMnhLEUmok0EbpEwUlUN7R1dNnYQYnBctrz6Khii3QTN5sUTuCVDGl7Hr9rRmRrvK1T5ESSVtqX4mbhjbnmn68EC_alysazpGDInbYeifx7YYUoTJ5d8BJLodWET9zsnR9bmncIYZa602IPEi3Dq1xbo_ZrKZFdPXQGlsy2v2MRdfUXlND3xFLF1LTBRKg-6g5_khrg", title: "Sunflower Smile", author: "beadbot" },
  { alt: "A square perler bead pattern of a sleeping Shiba Inu dog.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHAOCdLCFExFcb50kRpOBpSpAhCiXLh5szaJt5crPpk7HbYvUDA98zZdwgLmnFW-VZ-1emAOnHPVhJDQS60erBkN4ytiUKcpX5_QQl2iC6mPTOvCRjSMiL6dEojI_X25m2NnrVyzPB_yyrHyb0bq35Ay98fkUfl1zKifaxDXb9cvlEqx9xaR5WzMH7LNKUE_j4fhOdf5fsvSsjeaQTtoqqmpWtP6v52p-NUPieO5qnin_MsPjJ8KjxRMsdKnA1AGi8swIHPdCI6RE", title: "Sleepy Shiba", author: "kawaii-ai" },
  { alt: "An intricate perler bead pattern of a retro gaming controller.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdfOtAF1zQXzEfrlFnpjZycfVyECcg71sRmNjdIR4udZbcLJemQkkz9KkyFs7jegyCCBziEtdVBhywv5GaDWiqHwN7DtMiVdHLRQGsFO_UfQEPOuuP8eb94oe__SmvPeOE0sMYAvr7jP11f4z-MoyZmaXVRQ8qecLdKb9l_Bann5mIVctQFJrc6WQhic2hDIAnREW66WuYitrn7f1YlCeYFmpM4fRT0E_ycldM6Qa78UJbihKs5zQBpYUHBtBYQdggs8S-v7gPo6o", title: "Retro Controller", author: "pixelmaster" },
  { alt: "A tall masonry card featuring a stack of three pancakes with a pat of butter.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLBfgDuArJbv2kH8VsS-OwYal-bGD8D4nFmbCw9Rs3ng_pJ3S4bNVJABadpquNG97uC8LhK2juz8f0HpsO0RBi1SKgwEYKSb5Hq87eA3usRdnIYG8S7w7AKFyxfrFjFf7oSzy4MS2P5TK9z6gjwEFL272q25vdfZHqzuak4UPt6WF35StRwQmVa8nXioOBM_HxL0duJhQZZndnBYjdPoLrjFnbHxgnxWoh569-0-zWvHnsIpUDBwR0fShFBi_4U4XrHNK9ifvD0gc", title: "Pancake Stack", author: "foodie-beads" },
  { alt: "A wide perler bead pattern of a small ocean wave in the style of Japanese woodblock prints.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJHn3w4sSU2etnKICbDHbnswcP7U70DuR2gYLfHp3a3rl6HHZsFB3I5qEGy2ZowY53EUjvvMqvrJGKTzICBVY6kRMQgJiVA3r5BHhJv1jiwlLyDOyrl0F4tSI-j6EpUgiVjbeVXNe2IohA8rkrgY_nZ1TjqQnd_CeKbwsQtXF6BsO4_uwZcz1-tBU4DFt3JhN3gLFDmmhPQj1cBuI2Fz_qZKI6iosbJyeyi0W0lA58DnfW16UXS13logMCpehLCWddroCPZ3NOfDQ", title: "Ocean Wave", author: "nature-pixel" },
  { alt: "A delicate perler bead pattern of a cherry blossom branch.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxZjLeI75gb3SxyR53kHFnmHAmyxWV2TJ9u0L1UnUDpIouhgKYUVgDuYlF8Kuo_nBI1qLoJw-s4wH8bi4iTJ8QOiwgS6nhfX6mS7jy63nyPlj7J8lyNGl4hZudtHKikanxXEtJTXBUK0H1zMKB7i3RQlC3g9reRwdfK_0HNS2ey4bxvq7mgDzqldiIA_LP930mXrGGeAZm6NbayGACon0YDk1GG5MBfxdzYkffbfmXTDHlnUvHl_O1bQvgi9MwuQPP85zzzSen_vE", title: "Cherry Blossom", author: "sakura-ai" },
  { alt: "A perler bead pattern of a cute little robot with heart eyes.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUlBiQ9EnQHUUF7g2WsrXoVUB7p8Qk80n--4roaKU7Q9EWwfXqaAMV_hau9PbW0RGHwQWkWlxGIykSeCi-Ouu4tIeRNNxIR6wFcR72tfDKcjzSvW467TLvxoIgSCEdXhdOXUoeSqcQVBlNqeLEdYa74NIeEjpnCEWrvmEerZp31Ll9YV4pdYO6tOl0o6WKqn_ksNRXXWy-XcwITkL8Lu8LvUjyRDPdpp8n_281si0KK64DKbrSlk76FttKEFJxvroeVif2RO3h2ic", title: "Heart-Eye Robot", author: "robot-lover" },
  { alt: "A perler bead design of a small rainbow with clouds at the ends.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQDRENZJ2EEbKo0IRZI8NCZGi44SlTvFWzOvsP_JSBucgmfNKZOrtQpgWkqcNhaFunGfIgobF_BHMfq-lcUFMTciFvZB88txlsTLlz9AP_VaXgdkN7C29FFUQD140cg7iEROmFpzz-8bABE4tda--hAK5lxnOhVdU2dqDUYhyQ4rhX94L3ud1HNtoY9TpsXMkiZfHxOyV2vPs24HwB6ddiukKRHAqdFk5TsPjL-rICKsBqq6PYnxCnnOx_OVQ0tRwq05LkS1dggos", title: "Rainbow Clouds", author: "sky-beads" },
  { alt: "A detailed perler bead pattern of a slice of watermelon.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlIVGECYONoKluZa3_YCn049r1WlcnYP4JTDC7DK72nI_ghZOmMyw_HjvhYGr5DM8P-X18r7f5EKl-OE21YreHSNYNITcSVtn_HyUWJ47S0FZDqabwUbd0KnrfbLE8Eg2yus27Z1rX0bnWRFDNQTM91FyyQaYz9HmzHA-WWfrW1Kw6aRt6Gl69m40LJhdIioESUaafRFIhCL-9FMtW98lo9E-HywojxNRnft_Ftu1Zv3CtkHAqmUyVWE0C78WE12uooYfggujBClc", title: "Watermelon Slice", author: "fruit-ai" },
  { alt: "A cute cactus in a pot perler bead pattern.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAInhFiKNWY9K9bOSoxsChz9Qu4KQDuUpBivudRniQnnjTC4zUTA9fUW_sxSlvq76hAS1ebn9Bqj8T12B6jRahlZrTB11SILwz5NDAgggeyK2M1EeLCWr0BCJK0b_sHZ6ixz8N4h9X3bJCEoQAVOEFmF9UzMkGH4IUBdIVSCkJF8mqwEy_f_nT3fppHNlMw93Nbl89TUrBLJjeI2VZacIhU_rVRl5d06TJHdK9qZzmNBPep68mtiK5RLKzXe_MxDJ9YEi_0MLSsvj0", title: "Potted Cactus", author: "plant-beads" },
  { alt: "A perler bead pattern of a moon and stars.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8qmnZRIkhL3_wbj0apImFztwqfNE2qo1Ajplf3KwjJJq-DK9tj0AG016zcondXwFLBNgBuJnck0-uDx783F1iZrOf4Lkaxrs8m8j4SHFgpGioDxjHCdYiIZXGCPWpi8H_mVrPIIcuCrKa-vhJw-eObXWbUe25EajWDqJXVaFyqqi3k8X2ldI5rUw7tC8a8AT_PMA8zXpoR-ssCojbidyw7PKpNm1DtMzBmbYxVbnuXOvkJh5PT6EQbAxfcp_gx3OzQv8LrFH2_xU", title: "Moon & Stars", author: "night-pixel" },
  { alt: "A perler bead pattern of a small heart-shaped locket.", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFTjPvlpmb_SxGffcCRQZf5nO6ZqoS4BCmSXXOLmQhzLTSe84XY2YW9IjzyJ5hwNQ4PwE3hGyThmrM-tORNHhkL8RM3HmD_MjJw79nRQzCWe4kshXFx3Ey6Ogai-9GTW_zKg4XIzJbzd7wHdcG4Rgfz6BIc1KKlPXhkPSK2Y7Fc4xOIZkrxcUNQtQ42hXJSOIWZILpwsjtUY3C4_JuN1WH92xSQVcefQ5t57an35ULsWGHQzb00DgdVNmfNTfi7M2l0YMxPbjgnZE", title: "Heart Locket", author: "love-beads" },
];

export default function InspirationGallery() {
  return (
    <section className="px-4 md:px-12 py-16 bg-surface" id="gallery">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary">Inspiration Gallery</h2>
          <p className="text-secondary text-sm mt-1">Discover ideas from the community — save, share, and craft.</p>
        </div>
        <button className="text-secondary font-label-sm flex items-center gap-2 hover:text-primary transition-colors">
          View All <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {images.slice(0, 8).map((img, i) => (
          <div
            key={i}
            className="bg-white rounded-xl bead-shadow transition-all hover:-translate-y-1 overflow-hidden group cursor-pointer"
          >
            <div className="aspect-square overflow-hidden bg-secondary-container relative">
              <img className="w-full h-full object-cover" alt={img.alt} src={img.src} />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                <button className="bg-white text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                  <span className="material-symbols-outlined">visibility</span> Quick Preview
                </button>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container transition-colors">
                  <span className="material-symbols-outlined">file_download</span> Download
                </button>
                <button className="bg-secondary-container text-primary px-4 py-2 rounded-lg font-label-sm flex items-center gap-2 hover:bg-primary-container hover:text-white transition-colors">
                  <span className="material-symbols-outlined">auto_awesome</span> Generate Similar
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-headline-md text-body-md">{img.title}</h3>
              </div>
              <div className="flex items-center justify-between text-label-sm text-secondary">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">person</span> {img.author}
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
