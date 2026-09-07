import { useId, useState } from "react";

// ════════════════════════════════════════════════════════════════════
// UW ASİSTANI — KARAR MATRİSİ v14
// SOMPO kurumsal kimlik · Global Ring kırmızısı · platin halka · siyah
// Dashboard + Portföy Atlası + 4 aşama detay + Karar Matrisi sidebar
// Pilot: FESLEĞEN TOPLU YEMEK (KTT26011115) — gerçek MOP verisi
// ════════════════════════════════════════════════════════════════════

// ─── SOMPO KURUMSAL TASARIM TOKENLARI ───────────────────────────────
// Marka ekseni logodan türetildi: kırmızı küre (Global Ring) + platin
// halka + siyah SOMPO yazısı.
//
// KONTRAST KURALI: metin taşıyan her token beyaz (#FFF), kâğıt (#FAFAFA)
// ve kart (#F4F4F4) zeminlerinde WCAG 2.2 AA normal metin eşiğini
// (≥ 4.5:1) geçer. Canlı ama açık tonlar yalnızca DOLGU/BAR/ÇİZGİ
// olarak kullanılır — bunların adı `*Fill` ile biter, metin rengi
// olarak kullanılmamalıdır.
const T = {
  // ── Marka · Global Ring kırmızısı ────────────────────────────────
  red:       "#C8102E",  // Ana marka kırmızısı — beyaz üstünde 5.88:1 ✓
  redDeep:   "#8E0B20",  // Koyu kırmızı — masthead, gradient dibi · 9.46:1 ✓
  redBright: "#E4173A",  // Parlak kırmızı — küre üst ışığı, hover · 4.68:1 ✓
  redTint:   "#FCE9EC",  // En açık pembe — matris hücresi, soft chip (dolgu)
  redSoft:   "#F8DDE1",  // Açık pembe — kart arkaplanı (dolgu)
  onBrand:   "#FFE6E9",  // Marka/durum zeminleri üstünde caption — min 4.97:1 ✓

  // ── Platin halka · nötr eksen (yalnız dolgu/çizgi) ───────────────
  platinum:    "#D9D9D9",
  silverLight: "#D5D5D5",
  silverBg:    "#F4F4F4",

  // ── Metin merdiveni · siyah SOMPO yazısından ─────────────────────
  ink:        "#161616",  // Ana yazı · 18.10:1 ✓
  inkSoft:    "#3D3D3D",  // Gövde metni · 10.86:1 ✓
  silverDeep: "#4A4A4A",  // Koyu caption · 8.86:1 ✓
  inkMute:    "#5F5F5F",  // Yardımcı metin · 6.39:1 ✓  (eski #888888 → 3.54:1 AA'yı geçmiyordu)
  silver:     "#6E6E6E",  // Etiket / caption · 5.10:1 ✓ (eski #A8A8A8 → 2.38:1 AA'yı geçmiyordu)

  // ── Çizgiler ─────────────────────────────────────────────────────
  rule:       "#E5E5E5",
  ruleStrong: "#CCCCCC",
  ruleSoft:   "#F0F0F0",

  // ── Durum renkleri · metin koyu, dolgu canlı ─────────────────────
  green:     "#1E6B23",  // Pozitif metin · 6.60:1 ✓
  greenFill: "#2E7D32",  // Pozitif bar/dolgu
  greenSoft: "#E8F5E9",
  amber:     "#8A5A00",  // Uyarı metni · 5.93:1 ✓ (eski #C9851E → 3.06:1)
  amberFill: "#C9851E",  // Uyarı bar/dolgu — METİN OLARAK KULLANMA
  amberSoft: "#FFF4E0",
  amberMid:  "#FFE4B5",  // Isı haritası orta bandı (dolgu)
  amberPale: "#FFF8E5",
  blue:      "#12539E",  // Bilgi metni · 7.62:1 ✓
  blueFill:  "#1565C0",  // Bilgi bar/dolgu
  blueSoft:  "#E3F2FD",
  oliveSoft: "#F0F4E8",  // Isı haritası marjinal bandı (dolgu)

  // ── Yüzeyler ─────────────────────────────────────────────────────
  white: "#FFFFFF",
  paper: "#FAFAFA",

  // ── Tipografi ────────────────────────────────────────────────────
  display: "'Fraunces', 'Times New Roman', serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'IBM Plex Mono', monospace",
};


// ─── Yardımcılar ────────────────────────────────────────────────────
// Türkçe binlik ayracı: 3300000 -> "3.300.000 ₺"
const fmtTRY = (n: number) => n.toLocaleString("tr-TR") + " ₺";

// ─── GLOBAL STİL KATMANI ────────────────────────────────────────────
// Satır içi stiller :hover / :focus-visible / @media yazamaz. Odak
// halkası, klavye erişimi ve daralma davranışı bu katmandan gelir.
function GlobalStyle() {
  return (
    <style>{`
      .sm-app { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; overflow-x: hidden; }

      /* Klavye odağı — her etkileşimli öğe görünür halka alır */
      .sm-app button:focus-visible,
      .sm-app select:focus-visible,
      .sm-app input:focus-visible,
      .sm-app a:focus-visible,
      .sm-app [tabindex]:focus-visible { outline: 3px solid #C8102E; outline-offset: 2px; }
      .sm-app tr[tabindex]:focus-visible { outline-offset: -3px; }

      /* Etkileşim geri bildirimi */
      .sm-app button { transition: background .15s ease, border-color .15s ease, color .15s ease, filter .15s ease; }
      .sm-app button:not(:disabled):hover { filter: brightness(0.93); }
      .sm-app tr[tabindex]:hover { background: #F4F4F4; }

      /* Geniş tablo kendi kabında kayar — sayfa yatay kaymaz */
      .sm-scroll { overflow-x: auto; }

      /* Daralma kırılmaları */
      @media (max-width: 1180px) {
        .sm-app > main { grid-template-columns: 1fr !important; }
        .sm-app aside { position: static !important; }
        .sm-kpi { grid-template-columns: repeat(4, 1fr) !important; }
        .sm-grid5 { grid-template-columns: repeat(3, 1fr) !important; }
      }
      @media (max-width: 860px) {
        .sm-kpi { grid-template-columns: repeat(2, 1fr) !important; }
        .sm-grid5 { grid-template-columns: repeat(2, 1fr) !important; }
        .sm-app > nav > div { overflow-x: auto; }
      }

      @media (prefers-reduced-motion: reduce) {
        .sm-app *, .sm-app *::before, .sm-app *::after {
          animation-duration: .01ms !important; animation-iteration-count: 1 !important;
          transition-duration: .01ms !important;
        }
      }

      @media print {
        .sm-app { background: #fff !important; }
        .sm-app nav, .sm-app aside { display: none !important; }
      }
    `}</style>
  );
}

// ════════════════════════════════════════════════════════════════════
//                    DEMO DATA — RISK / BENCHMARK / PROFIT
// ════════════════════════════════════════════════════════════════════
const RISK = {
  ref: "KTT26016457",
  date: "24.02.2026",
  type: "Yeni İş",
  status: "Müdür Onayında",
  uw: "Yusuf Saçan",
  authority: "Müdür Yardımcısı",
  customer: "GALVA METAL SANAYİ VE TİCARET A.Ş.",
  activity: "Metal Kaplama / Galvaniz",
  activityType: "İmalat — Metal İşleme",
  nace: "2511",
  sumInsured: 1573121690,
  grossPremium: 4125000,
  agent: { name: "MONOPOLİ SİGORTA", code: "AC-7821", segment: "Gümüş" },
  appetite: {
    score: 58, band: "ŞARTLI",
    detailFactors: [
      { k: "Müşteri Segmenti", v: "2C — Orta-büyük endüstriyel", woe: 0.474, score: 0.432 },
      { k: "Faaliyet Kodu Grubu", v: "GR_3 — Yüksek tehlikeli", woe: 1.151, score: 0.232 },
      { k: "Bina Yaşı", v: "2000-2006 yılları arası", woe: 0.877, score: 0.085 },
      { k: "3.Şahıs Emtea Teminat Oranı", v: "0.10 ≤ oran ≤ 0.999", woe: 0.219, score: 0.075 },
      { k: "Acente Bölgesi", v: "İstanbul Anadolu 1 (Tuzla)", woe: -0.135, score: -0.133 },
      { k: "Acente 6Ay 106 YHR", v: "29 < HR ≤ 60", woe: -0.256, score: -0.206 },
      { k: "Acente 6Ay 112 YHR", v: "4 < HR ≤ 18", woe: -0.421, score: -0.159 },
      { k: "Acente 1Y 112 Ürün Dağılımı", v: "0.0185 ≤ D ≤ 0.0449", woe: -0.454, score: -0.332 },
      { k: "Acente 1Y Kurumsal Üretim", v: "39 < Adet ≤ 393", woe: -0.053, score: -0.023 },
      { k: "Acente Çalışma Grubu", v: "PROFESYONEL", woe: -0.226, score: -0.084 },
    ],
    totalScore: -0.143,
    sabit: -0.030,
    riskOlasilik: 46.4,
    nihai: "SARI",
    nihaiAciklama: "ŞARTLI · UW DEĞERLENDİRMESİ",
  },
  riskScore: { score: 47, band: "ORTA-DÜŞÜK", color: "#1565C0" },
  matrix: { x: 0, y: 0, label: "Sol-Üst — Hedef İş",
    note: "Risk kalitesi orta, frekans loss ratio sektör ortalamasının altında — rekabetçi olunabilir bir konumda. Tarife sınıfı 4 olduğundan koşullar kısıtlayıcı şekillenebilir; deprem bölgesi 1 ek bir uyarı.",
    yonlendir: "Hedef iş adayı — fiyatlama ve teminatla şartlı kabul önerilir." },
  physical: {
    yapiTipi: "Çelik konstrüksiyon + betonarme idari", yapimYili: 2000,
    toplamAlan: "24.500 m²", osb: "Tuzla Kimya OSB",
    deprem: "Bölge 1", sprinkler: "Kısmi (üretim %60, depo yok)",
    bitisik: "Bitişik nizam — komşu kimya tesisi", metroFn: "Tuzla — 1.4 km",
  },
  quality: {
    cope: {
      C: { score: 72, note: "Çelik konstrüksiyon · 2000 sonrası inşa · uyumlu" },
      O: { score: 41, note: "Galvanize hattı sıcak işlem · yangın yükü yüksek" },
      P: { score: 55, note: "Sprinkler kısmi · duman dedektörü yok · itfaiye 1.8 km" },
      E: { score: 38, note: "Bitişik kimya tesisi · komşuluk riski yüksek" },
    },
    onRisk: {
      depremBolge: "Bölge 1 — Yüksek", depremDikkat: true,
      sel: "Düşük", heyelan: "Yok",
      faya: "8.4 km — Orta", itfaiye: "1.8 km — İyi",
      komsuluk: "Orta — bitişik OSB tesisi", komsuDikkat: true,
    },
  },
  claims5y: { count: 7, total: 18240000, hpRatio: 43,
    biggest: { year: 2024, amount: 12400000 },
    distribution: [
      { year: 2021, amount: 240000, count: 1 },
      { year: 2022, amount: 1180000, count: 2 },
      { year: 2023, amount: 480000, count: 1 },
      { year: 2024, amount: 14120000, count: 2 },
      { year: 2025, amount: 2220000, count: 1 },
    ],
    note: "2024 galvaniz hattı yangını portföyün 5y H/P'sini sektör ortalamasının üzerine çıkarıyor. RT raporunda iyileştirme önerileri kritik."
  },
  premium: {
    netPrim: 3300000, brutPrim: 4125000, minTeknikPrim: 4680000, primAdequacy: -12,
    sektorOrtKomisyon: 10, acenteTalebi: 28, fark: 18,
  },
  competition: { hitRatio: 18, portfolyoHP: 52 },
  natural: { deprem: { zone: 1, accumulation: "Aynı binada 2 mevcut poliçe" } },
  legal: { otorizasyon: { count: 4, items: ["Bedel limit", "Komşuluk", "Hasar", "Komisyon"] } },
  capacity: {
    bedelAsim: true, kumulAsim: "Aynı binada 2 mevcut poliçe",
    bdl: 800000000, kumul: 2980000000, treaty: 72, ihtiyari: true, strategic: 108,
    bdlKullanim: 197,
  },
};

const BENCHMARK = {
  matrix: [
    { z: "B1", years: [1.65,1.59,1.57,1.55,1.67,1.63,1.81,2.02,2.99,2.65], y10: 1.88 },
    { z: "B2", years: [1.16,1.09,1.14,1.50,1.52,1.65,1.85,2.29,2.37,2.17], y10: 1.82 },
    { z: "B3", years: [1.11,0.99,0.99,1.02,1.36,1.29,1.50,1.91,2.36,2.18], y10: 1.72 },
    { z: "B4", years: [0.62,0.56,0.60,0.52,1.29,1.28,1.34,1.95,2.21,2.15], y10: 1.34 },
    { z: "B5", years: [0.59,0.57,0.60,0.86,0.95,1.00,0.95,1.44,1.59,1.46], y10: 1.30 },
    { z: "B6", years: [null,null,null,0.92,0.73,0.76,0.92,1.34,1.54,1.39], y10: 1.21 },
    { z: "B7", years: [null,null,null,1.30,0.62,0.62,0.81,1.08,1.30,1.12], y10: 0.99 },
  ],
  yearLabels: ["16","17","18","19","20","21","22","23","24","25"],
  thisRisk: {
    bolgeOrt: 2.65, fkOrt: 1.72, bandOrt: 2.58, band3y: 2.06,
    teklif: 2.62, devVsBand: 1.6, dev3y: 27.2,
    sapma: "Çapaya yakın",
    yorum: "Bölge 1 büyük rizikoda piyasa ortalamasında konumlanıyor. FK çapası ile farklı çünkü galvaniz prosesinin yangın yükü saf metal eşya üretiminden yüksektir — fark savunulabilir.",
  },
  insight: "Sertleşme dalgası: 2020 sonrası tüm bölgelerde net fiyat ivmesi (pandemi sonrası reasürans + 2023 deprem). 2024 → 2025 geçişinde tüm bölgelerde fiyat düşüşü → piyasa rekabeti baskısı.",
};

// ════════════════════════════════════════════════════════════════════
//   MASTER PORTFÖY ANALİZİ — 112 BİLEŞİK ÜRÜN, 10 YIL (2016-2025)
//   Sompo gerçek UW davranışı: 38.146 poliçe / 21.721 hasar
//   Toplam 195,1 M EUR brüt prim · 112,8 M EUR brüt hasar · H/P %57,8
// ════════════════════════════════════════════════════════════════════
const MASTER = {
  meta: {
    period: "10 yıl (2016-2025)",
    totalPolicies: 38146,
    totalClaims: 21721,
    totalPremium: 195052183,    // EUR
    totalLoss: 112782700,        // EUR
    overallHP: 57.82,
    overallNetResult: -21400000, // 10y kümülatif (mevcut parametrelerle)
    selectedFK: 204,
    totalFK: 408,
    selectedPremShare: 41,
    selectedHP: 46.74,
  },
  // C1 Ekonomik Model: Acente kom %25 + Reas kom %20 + GG %10 + Hedef Kar %5
  // CAT bölgeye göre: B1-2 %20, B3-5 %15, B6-7 %10
  // Break-even HPO: 100 - 25 - 10 - CAT - 5 = (60 - CAT)
  parametre: {
    acenteKom: 25, reasKom: 20, gg: 10, hedefKar: 5,
    catB12: 20, catB35: 15, catB67: 10,
    capMaxKons: 8500000, // 8.5M EUR tek risk konservasyon limiti
  },
  // Bölge bazlı 10y gerçekleşen davranış (E1 Bölge Analizi - SEÇİLİ portföy)
  bolge: [
    { z: 1, cat: 20, breakeven: 40, hedef: 35, police: 5520, prim: 22560551, hp: 51.21, depremPay: 83.93, komisyonMax: 45,
      durum: "ZARAR", sapma: 11.21, hacimPayi: 28.6, label: "Marmara/İst-Anadolu", note: "11 puan break-even üstü, hacim büyük. Fiyat artışı + kapasite kısıtı." },
    { z: 2, cat: 20, breakeven: 40, hedef: 35, police: 6732, prim: 22749935, hp: 44.26, depremPay: 83.50, komisyonMax: 45,
      durum: "MARJİNAL ZARAR", sapma: 4.26, hacimPayi: 28.9, label: "Bursa/Kocaeli/İzmir", note: "Marjinal zarar, fiyat ince ayarı yeterli olabilir." },
    { z: 3, cat: 15, breakeven: 45, hedef: 40, police: 2754, prim: 15872580, hp: 37.78, depremPay: 76.93, komisyonMax: 50,
      durum: "KARLI", sapma: -7.22, hacimPayi: 20.1, label: "Eskişehir/Ankara batı", note: "Hedef portföy — komisyon/kampanya ile büyüt." },
    { z: 4, cat: 15, breakeven: 45, hedef: 40, police: 2387, prim: 4804013, hp: 61.59, depremPay: 74.32, komisyonMax: 50,
      durum: "ZARAR", sapma: 16.59, hacimPayi: 6.1, label: "Konya/Kayseri", note: "Küçük hacim ama yüksek HPO — kök neden analizi gerekli." },
    { z: 5, cat: 15, breakeven: 45, hedef: 40, police: 1822, prim: 9735031, hp: 42.94, depremPay: 81.10, komisyonMax: 50,
      durum: "MARJİNAL KAR", sapma: -2.06, hacimPayi: 12.3, label: "Kayseri/Erzurum/Van", note: "Sınırda kar — koruyarak büyüt, deprem payı izle." },
    { z: 6, cat: 10, breakeven: 50, hedef: 45, police: 498, prim: 1710447, hp: 47.55, depremPay: 74.21, komisyonMax: 55,
      durum: "MARJİNAL KAR", sapma: -2.45, hacimPayi: 2.2, label: "Hatay/Şanlıurfa", note: "Yüksek komisyon (%55) ile rahatlama imkanı." },
    { z: 7, cat: 10, breakeven: 50, hedef: 45, police: 606, prim: 2725825, hp: 70.92, depremPay: 66.35, komisyonMax: 55,
      durum: "ZARAR", sapma: 20.92, hacimPayi: 3.5, label: "Trakya/iç Karadeniz", note: "Küçük hacim, anomali izle. Hasar yoğunlaşması var." },
  ],
  // 5 segmentli HPO yapısı (C3)
  segment: [
    { id: "A", label: "Karlı", range: "<%45", hpRange: [0, 45], fkSayi: 326, secili: 155, police: 25736, prim: 111872539, hp: 20.45, primPay: 57.4, karar: "KONSERVASYON", aksiyon: "Hedef portföy — komisyon/kampanya", color: "green" },
    { id: "B", label: "Marjinal Kar", range: "%45-50", hpRange: [45, 50], fkSayi: 9, secili: 7, police: 644, prim: 4072029, hp: 46.62, primPay: 2.1, karar: "KONSERVASYON", aksiyon: "Fiyat ince ayar düşün", color: "green" },
    { id: "C", label: "Zararda ama tutulmalı", range: "%50-65", hpRange: [50, 65], fkSayi: 22, secili: 13, police: 6015, prim: 42902934, hp: 56.69, primPay: 22.0, karar: "KONSERVASYON", aksiyon: "Yeniden fiyatla — fiyat artışı", color: "amber" },
    { id: "D", label: "Cede", range: "%65-100", hpRange: [65, 100], fkSayi: 13, secili: 8, police: 2243, prim: 15334669, hp: 82.45, primPay: 7.9, karar: "CEDE", aksiyon: "Yenilemeyi değerlendir", color: "amber" },
    { id: "E", label: "Tam Cede + Aksiyon", range: ">%100", hpRange: [100, 999], fkSayi: 38, secili: 21, police: 2711, prim: 20870012, hp: 244.57, primPay: 10.7, karar: "CEDE", aksiyon: "Portföyden çıkar / yeniden fiyatla", color: "red" },
  ],
  // Top 15 FK 10 yıllık gerçek davranışı (E3)
  topFK: [
    { kod: 6363, ad: "OTEL,MOTEL,PANSİYON,TATİL KÖYÜ", police: 1411, prim: 16154274, hp: 51.54, depremPay: 82.62, karar: "KONSERVASYON", segment: "C" },
    { kod: 6349, ad: "METAL EŞYA VE PARÇA İMALATI", police: 1375, prim: 8166108, hp: 61.64, depremPay: 80.12, karar: "KONSERVASYON", segment: "C" },
    { kod: 6450, ad: "MAKİNE, MOTOR İMALATI", police: 617, prim: 5136875, hp: 31.82, depremPay: 79.73, karar: "KONSERVASYON", segment: "A" },
    { kod: 6463, ad: "ORTAK KULLANIM ALANLARI", police: 1171, prim: 3834768, hp: 33.83, depremPay: 79.60, karar: "KONSERVASYON", segment: "A" },
    { kod: 6122, ad: "HASTANE", police: 312, prim: 3047315, hp: 68.53, depremPay: 81.73, karar: "CEDE", segment: "D" },
    { kod: 6123, ad: "HAVA MEYDANLARI VE İŞLETMELERİ", police: 19, prim: 2898121, hp: 2.29, depremPay: 44.68, karar: "KONSERVASYON", segment: "A" },
    { kod: 6351, ad: "ALIŞVERİŞ MERKEZLERİ", police: 198, prim: 2381735, hp: 152.96, depremPay: 92.05, karar: "YENİDEN FİYATLA", segment: "E" },
    { kod: 6230, ad: "OTO YEDEK PARÇA İMALAT (METAL)", police: 251, prim: 2379876, hp: 26.30, depremPay: 81.94, karar: "KONSERVASYON", segment: "A" },
    { kod: 6223, ad: "OTEL,MOTEL,PANSİYON,TATİL KÖYÜ", police: 421, prim: 2264982, hp: 61.79, depremPay: 89.52, karar: "KONSERVASYON", segment: "C" },
    { kod: 6378, ad: "BÜROLAR, OFİSLER, YAZIHANE", police: 826, prim: 1702979, hp: 19.12, depremPay: 89.55, karar: "KONSERVASYON", segment: "A" },
    { kod: 6343, ad: "ORTAK KULLANIM ALANLARI", police: 917, prim: 1566516, hp: 90.58, depremPay: 85.83, karar: "CEDE", segment: "D" },
    { kod: 6485, ad: "PLAZA / HAN BİNASI", police: 129, prim: 1556991, hp: 26.25, depremPay: 90.17, karar: "KONSERVASYON", segment: "A" },
    { kod: 6461, ad: "OKUL, KOLEJ", police: 247, prim: 1356269, hp: 18.13, depremPay: 93.99, karar: "KONSERVASYON", segment: "A" },
    { kod: 6132, ad: "İLAÇ İMALATI", police: 125, prim: 1338595, hp: 43.61, depremPay: 74.09, karar: "KONSERVASYON", segment: "A" },
    { kod: 6398, ad: "GIDA MADDELERİ TOPTAN SATIŞ", police: 761, prim: 1321347, hp: 13.47, depremPay: 75.24, karar: "KONSERVASYON", segment: "A" },
  ],
  // FK × Bölge HPO matrisi — Top 15 FK kombinasyon davranışı (E4)
  fkBolgeHPO: {
    6363: [28.29, 60.99, 37.08, 41.99, 48.39, 61.98, 51.11],
    6349: [33.54, 51.78, 100.20, 29.25, 70.72, 37.52, 108.66],
    6450: [43.77, 16.77, 32.92, 3.64, 30.66, 36.53, 40.36],
    6463: [48.22, 25.18, 34.97, 27.80, 34.78, 27.54, 71.56],
    6122: [18.68, 96.02, 51.93, 280.35, 73.47, 0, 66.05],
    6123: [0, null, 0, null, 10.24, null, null],
    6351: [455.82, 29.35, 32.83, 33.36, 59.41, 3.19, 92.36],
    6230: [23.76, 34.87, 6.58, 54.16, 0, 0, 41.05],
    6223: [50.66, 46.75, 36.47, 163.22, 23.84, null, null],
    6378: [5.70, 24.33, 22.56, 16.50, 15.13, 187.19, 4.25],
    6343: [81.66, 101.13, 71.50, 143.56, 227.02, null, null],
    6485: [14.04, 25.37, 19.07, 31.98, 69.37, null, 85.37],
    6461: [23.58, 3.84, 24.67, 21.97, 22.49, 19.77, 13.38],
    6132: [1.97, 21.49, 20.60, 1509.70, 32.54, 0, 115.42],
    6398: [2.07, 17.22, 29.59, 2.68, 8.36, 20.95, 0.15],
  } as Record<number, (number | null)[]>,
  // Karar matrisi mantığı: bedel × bölge için risk adımı
  karar: (hp: number, bolge: number, bedelM: number) => {
    const cat = bolge <= 2 ? 20 : bolge <= 5 ? 15 : 10;
    const breakeven = 100 - 25 - 10 - cat - 5;
    const hedefKar = breakeven - 5;
    if (hp < hedefKar) return { tip: "HEDEF İŞ", renk: "green", aksiyon: "Komisyon esnek kullanılabilir, kapasite ayır" };
    if (hp < breakeven) return { tip: "MARJİNAL KAR", renk: "green", aksiyon: "Standart fiyatlama, koşullar net olsun" };
    if (hp < breakeven + 10) return { tip: "ŞARTLI KABUL", renk: "amber", aksiyon: "Fiyat +5-10 puan, RT, deprem muafiyeti %5" };
    if (hp < 65) return { tip: "AĞIR ŞARTLI", renk: "amber", aksiyon: "Fiyat artışı + bedel kıs, müdür onayı" };
    if (hp < 100) return { tip: "CEDE", renk: "red", aksiyon: "Konservasyona alma, fakülteyle hareket" };
    return { tip: "RED / YENİDEN FİYATLA", renk: "red", aksiyon: "Portföye girmemeli, 3x fiyat veya çıkar" };
  },
  // Top bulgular (özet karar destek için)
  bulgular: [
    "Bölge 1-2'de seçili portföy break-even üstünde (%51 ve %44 vs %40 eşik) — en büyük zarar kaynağı",
    "Bölge 3 net karlı (%38 HPO vs %45 BE) — büyütme hedefi",
    "FK 6351 (AVM) Bölge 1'de %456 HPO — kombinasyon risk",
    "FK 6122 (Hastane) Bölge 4'te %280 HPO — aykırı davranış",
    "FK 6123 (Hava Meydanları) %2,3 HPO — hedef portföy",
    "Deprem payı 7 bölgede ortalama %75+ — fark primi riski",
    "8,5M EUR cap konservasyon = optimum (yıllık ~3,5 M EUR fazladan kar)",
    "E segmenti (HPO>%100) 38 FK, hasarın %45'ini üretiyor — temizlenmeli",
  ],
};

const PROFIT = {
  bruteTeknik: 568188, netTeknik: 343188, yatirimGeliri: 152400, netNihaiKar: 495588,
  marj: 12.0,
  params: {
    bazFiyat: "3.23‰", bazFiyatNot: "B1/T4",
    duzeltme: 0.81, duzeltmeNot: "Teklif/Baz",
    hpo: "%49.3", hpoNot: "Revize",
    acenteKomisyon: "%18", acenteKomisyonNot: "Revize öneri",
    reasKomisyon: "%25", reasKomisyonNot: "Deprem dışı",
    konsOrani: "%10", konsOraniNot: "Tarife 4",
  },
  kaskad: [
    { k: "+ Yazılmış Brüt Prim", v: 4125000, color: "redDeep", w: 90 },
    { k: "− Devredilen Reasürans Primi", v: 3712500, color: "amber", w: 80 },
    { k: "Konservasyon Primi", v: 412500, color: "green", w: 9, divider: true, bold: true },
    { k: "+ Reasürans Komisyon Geliri", v: 928125, color: "redDeep", w: 22 },
    { k: "− Acente Komisyon Gideri", v: 742500, color: "amber", w: 17 },
    { k: "− Net Hasar (Kons × HPO)", v: 203363, color: "amber", w: 5 },
    { k: "− Genel Gider (%10)", v: 41250, color: "amber", w: 1 },
    { k: "− Cat Maliyet (%2.5)", v: 10313, color: "amber", w: 0.5 },
    { k: "Net Teknik Sonuç", v: 343188, color: "green", w: 8, divider: true, bold: true },
    { k: "+ Yatırım Geliri (Blokeli vade × faiz)", v: 152400, color: "redDeep", w: 4 },
    { k: "NET NİHAİ KAR", v: 495588, color: "green", w: 11, divider: true, bold: true, big: true },
  ],
  matrix: [
    { k: "Brüt Teknik Sonuç", v: 568188, marj: "%13.8", durum: "OK" },
    { k: "Brüt Kar Zarar (GG+CAT)", v: 516625, marj: "%12.5", durum: "OK" },
    { k: "Brüt Nihai (Yatırım Dahil)", v: 669025, marj: "%16.2", durum: "OK" },
    { k: "Reasürör Net Kar Zarar", v: -185500, marj: "%-4.5", durum: "NO" },
    { k: "Net Teknik Sonuç", v: 343188, marj: "%8.3", durum: "OK" },
    { k: "Net Nihai (Yatırım Dahil)", v: 495588, marj: "%12.0", durum: "OK" },
  ],
  verdict: "KARLI", verdictSub: "Net kar marjı %12.0 · Subsidy ödemesi yok · Reasürör tarafı sınırda",
  oneri: "POLİÇELEŞTİR", oneriSub: "Net Marj %12.0",
};

// ════════════════════════════════════════════════════════════════════
//             FESLEĞEN TOPLU YEMEK — KTT26011115 (gerçek MOP)
// ════════════════════════════════════════════════════════════════════
const TEKLIF_FESLEGEN = {
  ref: "KTT26011115",
  ozet: "112 / 112000000136649 / 0 / 0",
  durum: "Onay Bekleniyor", cozum: "Açık", etki: "Yok",
  uw: { code: "416658", name: "EZGİ ÖZKAN" },
  acentePartaj: "416658 - END ENDER SİGORTA",
  createdAt: "02/02/2026 11:41", updatedAt: "24/04/2026 08:20",
  topBadges: [
    { label: "MASAK", color: "#1976D2" },
    { label: "İCAP", color: "#A85400" },
    { label: "TAHSİLAT", color: "#1B6E20" },
  ],
  teklif: {
    urunNo: "112", urunAdi: "BİLEŞİK ÜRÜN", teklifNo: "112000000136649",
    yenilemeNo: 0, zeyilNo: 0, talepTuru: "Yeni İş", tipi: "Teklif",
    sonGuncelleme: "02/02/2026 11:39:00",
    baslangicTarihi: "02/02/2026", bitisTarihi: "02/02/2027",
    rizikoAdresi: "SARAY Mah. MH 671 Cad. CD 6 B APARTMANI BİNA NO 6 B PAFTA H29D18C1D ADA 3297 PARSEL 1 MERKEZ-MERKEZ BELDESİ AK 4090013139 KAHRAMANKAZAN ANKARA",
    uavtKodu: "4090013139", tarifeTarihi: "02/02/2026",
  },
  sigortaEttiren: { unvan: "FESLEĞEN TOPLU YEMEK HİZMETLERİ LİMİTED ŞİRKETİ", vkn: "3850527356", musteriNo: "84403342" },
  sigortali: { unvan: "FESLEĞEN TOPLU YEMEK HİZMETLERİ LİMİTED ŞİRKETİ", vkn: "3850527356", musteriNo: "84403342" },
  prim: {
    netPrim: 24594.32, brutPrim: 25832.49, komisyonTutar: 2459.43,
    komisyonOran: 10.0, doviz: "USD",
  },
  otorizasyon: [
    { kat: "BDL", text: "3. ŞMM BRANŞINDA MANEVİ TAZMİNAT TEMİNAT BEDELİ ŞAHIS BAŞI BEDENİ LİMİTİNİN %10 NU VEYA OLAY BAŞINA LİMİTİN %5 İNİ AŞTIĞI İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "BDL", text: "EC BRANŞINDA AZAMI BEDEL YETKİSİNİ AŞTIĞINIZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "BDL", text: "YANGIN BRANŞINDA AZAMI TEMİNAT BEDELİNİ AŞTIĞINIZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "BDL", text: "3. ŞMM (KAZA/OLAY BAŞI) AZAMI TEMİNAT LİMİTLERİNİ AŞTINIZ. LÜTFEN TTS ÜZERİNDEN YETKİ ALINIZ" },
    { kat: "BDL", text: "3. ŞMM (YILLIK AZAMI) AZAMI TEMİNAT LİMİTLERİNİ AŞTINIZ. LÜTFEN TTS ÜZERİNDEN YETKİ ALINIZ" },
    { kat: "BDL", text: "3. ŞMM (YILLIK) AZAMI TEMİNAT LİMİTLERİNİ AŞTINIZ. LÜTFEN TTS ÜZERİNDEN YETKİ ALINIZ" },
    { kat: "MUAFYT", text: "MK BRANŞINDA STANDART GENİŞ KASKO MUAFİYETİNİ SEÇMEDİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "RISK_K", text: "İŞVEREN MÜTEAHHİT, TAL. MÜT, TAŞERON, STAJYER TAZ. EK TEMİNATINI SEÇTİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "RISK_K", text: "İŞVEREN ÖZEL HASTANELERDE TEDAVİ MASRAFLARI EK TEMİNATINI SEÇTİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "RISK_K", text: "İŞVEREN TC DIŞINDA İŞ KAZALARI EK TEMİNATINI SEÇTİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "RISK_K", text: "MÜTEAHHİT VE TAŞERON TEMİNATI SEBEBİYLE OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "RISK_K", text: "ONAY YETKİNİZ BULUNMAMAKTADIR. LÜTFEN TEKLİF TAKİP SİSTEMİ ÜZERİNDEN YETKİ ALINIZ" },
    { kat: "RISK_K", text: "RİSK KABUL KRİTERLERİ GEREĞİ (MÜŞTERİ) TEKLİF ONAYLANAMAMAKTADIR. LÜTFEN TEKNİK MÜDÜRLÜK İLE GÖRÜŞÜNÜZ. (TBL-D8)" },
    { kat: "RISK_K", text: "T.C. DIŞINDA İŞ KAZALARI TEMİNATI SEBEBİYLE OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "TTS", text: "MK BRANŞINDA İŞ MAKİNASI SEÇİLDİĞİ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "İŞVEREN", text: "ÖZEL HASTANELERDE TEDAVİ MASRAFLARI LİMİTİ OLAN 2500 TL Yİ AŞTIĞINIZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "İŞVEREN", text: "MÜTEAHHİT, TAL. MÜT, TAŞERON, STAJYER TAZ. EK TEMİNATINI SEÇTİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "İŞVEREN", text: "TC DIŞINDA İŞ KAZALARI EK TEMİNATINI SEÇTİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "İŞVEREN", text: "TEMİNATI ASGARİ PRİM NEDENİYLE OTORİZASYONA DÜŞTÜNÜZ" },
    { kat: "MASAK", text: "İşleme devam edebilmek için, suç gelirlerinin aklanmasının ve terörün finansmanının önlenmesine ilişkin mevzuat gereği kimlik tespitine esas belgelerin sisteme yüklenmesi gerekmektedir." },
  ],
  rizikoTeftisApp: ["UYGULAMA M4 : RT YAPILMALIDIR."],
  ekBilgi: [
    { soru: "Sprinkler", cevap: "Evet" },
    { soru: "Duman Dedektörü", cevap: "Evet" },
    { soru: "Yangın Tüpü", cevap: "Evet" },
    { soru: "Yangın Dolabı", cevap: "Evet" },
    { soru: "Son 5 Yıl Hasar", cevap: "Hayır" },
    { soru: "Riziko İlk Defa Sigorta", cevap: "Hayır" },
    { soru: "3. Şahıslara Kiralanmış Depo", cevap: "Hayır" },
    { soru: "Acente Yenilemesi", cevap: "Hayır" },
  ],
  hedefPrim: 29000, hedefPrimDoviz: "USD",
  talepDetayi: "Merhaba, Ekli bedeller ile teklif çalışılmış olup, yetki ve maks indirim hususunda desteğinizi rica ederiz.",
  acente: {
    partaj: "416658", unvan: "END ENDER SİGORTA ARACILIK HİZM. LTD. ŞTİ.",
    sinif: "YENİ / 0", protokolDurumu: "—", acilisYili: "26/11/2024",
    uwSorumlusu: "ALİ RIZA SÜREN", tahsilatSorumlusu: "SAMET DURSUN",
    bagliGrup: "SERBEST", saticiIsmi: "ADZ ST 1", saticiBolge: "ADZ",
    durum: "AÇIK", ktYetkiGrubu: "BİREYSEL, SERBEST", calismaGrubu: "PROFESYONEL", kio: 1,
  },
  musteriGecmis: [
    { ref: "BO26005718", durum: "Beklemede", ozet: "FESLEĞEN YEMEK-FİLO KASKO TEKLİF TALEBİ", brans: "Yeni İş / Filo", date: "30/03/2026 15:50:57", partaj: "700035" },
  ],
  sigortaBedelleri: {
    toplamBedel: 390775500, toplamKapasite: 8934700.29,
    teminatlar: [
      { kod: "10-BİNA", bedel: 3000000, fiyat: 0.10, prim: 30.00 },
      { kod: "50-MAKİNA-TESİSAT", bedel: 2000000, fiyat: 0.10, prim: 20.00 },
      { kod: "60-DEMİRBAŞ", bedel: 200000, fiyat: 0.10, prim: 2.00 },
      { kod: "40-EMTEA", bedel: 400000, fiyat: 0.10, prim: 4.00 },
      { kod: "1061-3.ŞAHIS EMTEA", bedel: 150000, fiyat: 0.10, prim: 1.50 },
      { kod: "58-DEKORASYON", bedel: 750000, fiyat: 0.10, prim: 7.50 },
      { kod: "140-FIRTINA", bedel: 6500000, fiyat: 0.25, prim: 162.50 },
      { kod: "130-DAHİLİ SU", bedel: 6500000, fiyat: 0.25, prim: 162.50 },
      { kod: "150-KARA TAŞITLARI ÇARPMASI", bedel: 6500000, fiyat: 0.25, prim: 162.50 },
      { kod: "180-HAVA TAŞITLARI ÇARPMASI", bedel: 6500000, fiyat: 0.25, prim: 162.50 },
    ],
    totalCount: 55,
  },
  muafiyetler: [
    { konu: "MK MUAFİYETİ 1", aciklama: "0–5.000 USD ARASI MAKİNELERDE, MAKİNE BAŞINA MİN 150 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 2", aciklama: "5.001–10.000 USD ARASI MAKİNELERDE, MAKİNE BAŞINA MİN 350 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 3", aciklama: "10.001–25.000 USD ARASI MAKİNELERDE, MAKİNE BAŞINA MİN 500 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 4", aciklama: "25.001–50.000 USD ARASI MAKİNELERDE, MAKİNE BAŞINA MİN 750 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 5", aciklama: "50.001–100.000 USD ARASI MAKİNELERDE, MAKİNE BAŞINA MİN 1.250 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 6", aciklama: "100.001–200.000 USD ARASI MAKİNELERDE, MAKİNE BAŞINA MİN 1.500 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 7", aciklama: "200.001 USD VE ÜZERİ MAKİNELERDE, MAKİNE BAŞINA MİN 2.750 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "MK MUAFİYETİ 8", aciklama: "TENZİLİ MUAFİYET UYGULANACAKTIR" },
    { konu: "EC MUAFİYETİ 1", aciklama: "0–10.000 USD ARASI CİHAZLARDA, CİHAZ BAŞINA MİN 150 USD OLMAK ÜZERE HASARIN %10'U" },
    { konu: "EC MUAFİYETİ 7", aciklama: "TENZİLİ MUAFİYET UYGULANACAKTIR" },
  ],
  muafiyetTotal: 16,
  ilgiliTeklifler: [{ urunNo: 112, teklifNo: "112000000136649", baslangicTarihi: "02/02/2026", policeStatus: "T" }],
  tarifeSiniflari: [
    { sinif: "Yangın", cevap: 4 },
    { sinif: "Elektronik Cihaz", cevap: 2 },
    { sinif: "Makine Kırılması", cevap: 2 },
    { sinif: "Emniyeti Suistimal", cevap: 2 },
    { sinif: "İşveren", cevap: 2 },
    { sinif: "Üçüncü Şahıslara Karşı Mali Mesuliyet", cevap: 1 },
    { sinif: "Hırsızlık", cevap: 1 },
  ],
  musterekIsler: { musterekMi: false, jeranSirketKodu: "—", jeranSirketPayi: 0, sigortaliPay: 0 },
  dokumanlar: [
    { tip: "EC Listesi", yuklenmis: false },
    { tip: "Makine Listesi", yuklenmis: false },
    { tip: "Yangın Bilgi Formu", yuklenmis: false },
    { tip: "Fotoğraf", yuklenmis: false },
    { tip: "Diğer", yuklenmis: false },
  ],
  mbfDeprem: false,
  yorumlar: [{ user: "YASEMİN YEŞİL", date: "02.02.2026 12:06:29", restricted: true, text: "Merhaba,\nDeğerlendirmenizi rica ederiz.\nİyi çalışmalar." }],
};

// ════════════════════════════════════════════════════════════════════
//                          OFFER POOL — 16 teklif
// ════════════════════════════════════════════════════════════════════
type OfferStatus = "Hazırlanıyor" | "Müdür Onayında" | "GMY Onayında" | "Reasürans Onayında" | "Onaylandı" | "Reddedildi";
type AppetiteBand = "İŞTAH DAHİLİNDE" | "ŞARTLI" | "DİKKATLİ" | "İŞTAH DIŞI";
type ProfitVerdict = "KARLI" | "SINIRDA" | "REVİZE" | "ZARAR";
type MatrixPos = "TL" | "TR" | "BL" | "BR";

type Offer = {
  ref: string; date: string; customer: string; activity: string; nace: string;
  zone: number; tarife: number;
  sumInsured: number; grossPremium: number; pricePpm: number;
  agentName: string; agentSegment: string; uw: string;
  status: OfferStatus;
  appetiteScore: number; appetiteBand: AppetiteBand;
  riskScore: number; riskBand: string;
  profitMargin: number; profitVerdict: ProfitVerdict;
  matrixPos: MatrixPos; benchmarkDelta: number;
  flags: string[];
};

const OFFERS: Offer[] = [
  { ref: "KTT26011115", date: "02.02", customer: "FESLEĞEN TOPLU YEMEK HİZMETLERİ LİMİTED ŞİRKETİ", activity: "Hazır Yemek İmalatı / Catering", nace: "5610",
    zone: 5, tarife: 4, sumInsured: 390775500, grossPremium: 25832, pricePpm: 0.066,
    agentName: "END ENDER SİGORTA", agentSegment: "Yeni / Serbest", uw: "Ezgi Özkan",
    status: "Müdür Onayında", appetiteScore: 45, appetiteBand: "DİKKATLİ",
    riskScore: 52, riskBand: "ORTA-DÜŞÜK", profitMargin: 8.5, profitVerdict: "SINIRDA",
    matrixPos: "BL", benchmarkDelta: -8.4, flags: ["RT zorunlu", "BDL aşım", "MASAK eksik", "20 otorizasyon"] },
  { ref: "KTT26016457", date: "24.02", customer: "GALVA METAL SANAYİ VE TİCARET A.Ş.", activity: "Metal Kaplama / Galvaniz", nace: "2511",
    zone: 1, tarife: 4, sumInsured: 1573121690, grossPremium: 4125000, pricePpm: 2.62,
    agentName: "MONOPOLİ SİGORTA", agentSegment: "Gümüş", uw: "Yusuf Saçan",
    status: "Müdür Onayında", appetiteScore: 58, appetiteBand: "ŞARTLI",
    riskScore: 47, riskBand: "ORTA-DÜŞÜK", profitMargin: 12.0, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 1.6, flags: ["RT eksik", "BDL aşım", "Komisyon yüksek"] },
  { ref: "KTT26018102", date: "26.02", customer: "ÇUKUROVA TEKSTİL ENDÜSTRİ A.Ş.", activity: "Tekstil Dokuma", nace: "1310",
    zone: 2, tarife: 3, sumInsured: 880500000, grossPremium: 2103000, pricePpm: 2.39,
    agentName: "AKDENİZ SİGORTA", agentSegment: "Altın", uw: "Mehmet Özkan",
    status: "Onaylandı", appetiteScore: 72, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 65, riskBand: "ORTA-İYİ", profitMargin: 18.4, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 5.2, flags: [] },
  { ref: "KTT26019441", date: "27.02", customer: "KARAKAYA PLASTİK İMALAT LTD.", activity: "Plastik Eşya İmalatı", nace: "2229",
    zone: 5, tarife: 5, sumInsured: 425000000, grossPremium: 1398000, pricePpm: 3.29,
    agentName: "DOĞUŞ SİGORTA", agentSegment: "Bronz", uw: "Aysun Yıldız",
    status: "Reddedildi", appetiteScore: 28, appetiteBand: "İŞTAH DIŞI",
    riskScore: 35, riskBand: "KÖTÜ", profitMargin: -3.2, profitVerdict: "ZARAR",
    matrixPos: "TR", benchmarkDelta: 4.8, flags: ["Kırmızı çizgi", "Hasar yoğun"] },
  { ref: "KTT26020113", date: "28.02", customer: "AKDENİZ MOBİLYA ÜRETİM A.Ş.", activity: "Mobilya İmalatı", nace: "3109",
    zone: 3, tarife: 4, sumInsured: 312400000, grossPremium: 720000, pricePpm: 2.31,
    agentName: "BAŞAK SİGORTA", agentSegment: "Gümüş", uw: "Yusuf Saçan",
    status: "Müdür Onayında", appetiteScore: 65, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 58, riskBand: "ORTA-İYİ", profitMargin: 14.2, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: -2.1, flags: ["Sprinkler kısmi"] },
  { ref: "KTT26021004", date: "01.03", customer: "TUZLA KİMYA SANAYİ VE TİCARET", activity: "Boya - Apre (Tekstil)", nace: "2030",
    zone: 1, tarife: 5, sumInsured: 2853000000, grossPremium: 9215000, pricePpm: 3.23,
    agentName: "EGE SİGORTA", agentSegment: "Altın", uw: "Mehmet Özkan",
    status: "Reasürans Onayında", appetiteScore: 42, appetiteBand: "DİKKATLİ",
    riskScore: 38, riskBand: "ORTA-DÜŞÜK", profitMargin: 6.1, profitVerdict: "SINIRDA",
    matrixPos: "BR", benchmarkDelta: 22.3, flags: ["Fak. zorunlu", "Deprem B1", "Yüksek yangın yükü"] },
  { ref: "KTT26022871", date: "03.03", customer: "EGE OTEL & TURİZM İŞLETMECİLİK", activity: "Otel/Motel/Tatil Köyü", nace: "5510",
    zone: 5, tarife: 2, sumInsured: 1680000000, grossPremium: 2503000, pricePpm: 1.49,
    agentName: "ANADOLU SİGORTA", agentSegment: "Platin", uw: "Burak Aydın",
    status: "Müdür Onayında", appetiteScore: 75, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 71, riskBand: "İYİ", profitMargin: 22.1, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 0.8, flags: [] },
  { ref: "KTT26023115", date: "04.03", customer: "KOCAELİ DEMİR-ÇELİK ENDÜSTRİ A.Ş.", activity: "Metal Eşya İmalatı", nace: "2511",
    zone: 1, tarife: 3, sumInsured: 4205000000, grossPremium: 8410000, pricePpm: 2.00,
    agentName: "HDI SİGORTA ARACILIK", agentSegment: "Platin", uw: "Aysun Yıldız",
    status: "GMY Onayında", appetiteScore: 52, appetiteBand: "ŞARTLI",
    riskScore: 49, riskBand: "ORTA-DÜŞÜK", profitMargin: 8.2, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: -12.0, flags: ["Bedel aşımı", "Konservasyon yetersiz"] },
  { ref: "KTT26024009", date: "05.03", customer: "BURSA OTOMOTİV YAN SANAYİ A.Ş.", activity: "Makine, Motor İmalatı", nace: "2932",
    zone: 2, tarife: 3, sumInsured: 950000000, grossPremium: 2005000, pricePpm: 2.11,
    agentName: "ZURICH SİGORTA", agentSegment: "Altın", uw: "Yusuf Saçan",
    status: "Onaylandı", appetiteScore: 78, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 73, riskBand: "İYİ", profitMargin: 19.3, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 2.5, flags: [] },
  { ref: "KTT26025117", date: "06.03", customer: "TRAKYA UN VE GIDA SANAYİ", activity: "Gıda İmalat", nace: "1071",
    zone: 2, tarife: 2, sumInsured: 540000000, grossPremium: 1102000, pricePpm: 2.04,
    agentName: "ANADOLU SİGORTA", agentSegment: "Gümüş", uw: "Mehmet Özkan",
    status: "Müdür Onayında", appetiteScore: 68, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 62, riskBand: "ORTA-İYİ", profitMargin: 15.4, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 2.0, flags: [] },
  { ref: "KTT26025884", date: "07.03", customer: "ANKARA AVM YÖNETİM A.Ş.", activity: "AVM / Ortak Kullanım", nace: "6831",
    zone: 4, tarife: 1, sumInsured: 1250000000, grossPremium: 1900000, pricePpm: 1.52,
    agentName: "AKSA SİGORTA", agentSegment: "Platin", uw: "Burak Aydın",
    status: "Onaylandı", appetiteScore: 82, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 78, riskBand: "İYİ", profitMargin: 24.0, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 4.1, flags: [] },
  { ref: "KTT26026223", date: "10.03", customer: "GAZİANTEP HALI VE DOKUMA", activity: "Halı Fabrikası", nace: "1393",
    zone: 6, tarife: 4, sumInsured: 380000000, grossPremium: 720000, pricePpm: 1.89,
    agentName: "DOĞUŞ SİGORTA", agentSegment: "Bronz", uw: "Aysun Yıldız",
    status: "Reddedildi", appetiteScore: 22, appetiteBand: "İŞTAH DIŞI",
    riskScore: 25, riskBand: "KÖTÜ", profitMargin: -8.5, profitVerdict: "ZARAR",
    matrixPos: "TR", benchmarkDelta: 35.6, flags: ["Kırmızı çizgi", "Hasar yoğun", "Sprinkler yok"] },
  { ref: "KTT26027001", date: "11.03", customer: "İSKENDERUN LİMAN ANTREPO A.Ş.", activity: "Antrepo / Nakliye Deposu", nace: "5210",
    zone: 3, tarife: 4, sumInsured: 2100000000, grossPremium: 8001000, pricePpm: 3.81,
    agentName: "EGE SİGORTA", agentSegment: "Altın", uw: "Yusuf Saçan",
    status: "Müdür Onayında", appetiteScore: 38, appetiteBand: "DİKKATLİ",
    riskScore: 42, riskBand: "ORTA-DÜŞÜK", profitMargin: 9.1, profitVerdict: "SINIRDA",
    matrixPos: "BR", benchmarkDelta: 31.8, flags: ["Yüksek depo yoğunluğu", "Komşuluk riski"] },
  { ref: "KTT26028115", date: "12.03", customer: "KAYSERİ ŞEKER FABRİKASI", activity: "Gıda - Şeker", nace: "1081",
    zone: 4, tarife: 4, sumInsured: 720000000, grossPremium: 1598000, pricePpm: 2.22,
    agentName: "BAŞAK SİGORTA", agentSegment: "Gümüş", uw: "Mehmet Özkan",
    status: "Reasürans Onayında", appetiteScore: 55, appetiteBand: "ŞARTLI",
    riskScore: 51, riskBand: "ORTA-DÜŞÜK", profitMargin: 11.0, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 3.2, flags: ["Sezonsallık"] },
  { ref: "KTT26029015", date: "13.03", customer: "KONYA TARIM MAKİNELERİ A.Ş.", activity: "Makine, Motor İmalatı", nace: "2830",
    zone: 4, tarife: 3, sumInsured: 290000000, grossPremium: 510000, pricePpm: 1.76,
    agentName: "AKSA SİGORTA", agentSegment: "Gümüş", uw: "Burak Aydın",
    status: "Onaylandı", appetiteScore: 71, appetiteBand: "İŞTAH DAHİLİNDE",
    riskScore: 67, riskBand: "ORTA-İYİ", profitMargin: 16.8, profitVerdict: "KARLI",
    matrixPos: "TL", benchmarkDelta: 0.9, flags: [] },
  { ref: "KTT26030441", date: "18.03", customer: "MERSİN PETROKİMYA ENDÜSTRİ", activity: "Kimya / Petrokimya", nace: "2014",
    zone: 4, tarife: 6, sumInsured: 5800000000, grossPremium: 21990000, pricePpm: 3.79,
    agentName: "HDI SİGORTA", agentSegment: "Platin", uw: "Mehmet Özkan",
    status: "GMY Onayında", appetiteScore: 35, appetiteBand: "DİKKATLİ",
    riskScore: 32, riskBand: "KÖTÜ", profitMargin: 4.8, profitVerdict: "REVİZE",
    matrixPos: "BR", benchmarkDelta: 18.5, flags: ["Kırmızı çizgi yakın", "Fak. zorunlu", "Deprem B4"] },
];

const STAGES = [
  { id: "appetite", num: "I", label: "Risk İştahı", sub: "Kabul / ret eşik kontrolü" },
  { id: "quality", num: "II", label: "Risk Kalitesi", sub: "COPE & saha verileri" },
  { id: "design", num: "III", label: "Teklif Dizaynı", sub: "Fiyat, teminat, karlılık" },
  { id: "decision", num: "IV", label: "Karar & Onay", sub: "Yetki & aksiyon" },
];

// ════════════════════════════════════════════════════════════════════
//                   SOMPO LOGO — kırmızı küre + gümüş halka
// ════════════════════════════════════════════════════════════════════
//   SOMPO LOGO — Global Ring: kırmızı küre + platin halka + yazı
//   Halka küreyle KENETLENİR: sol-alt yayı kürenin ÖNÜNDEN,
//   sağ-üst yayı ARKASINDAN geçer. Kesişim kirişi (21.5,37.2)–(62.8,78.5)
//   üzerinden clipPath ile ikiye ayrılır.
// ════════════════════════════════════════════════════════════════════
function SompoLogo({ size = 48, withText = true, wordColor, stacked = false }:
  { size?: number; withText?: boolean; wordColor?: string; stacked?: boolean }) {
  // useId → aynı sayfada birden fazla logo render edilirse gradient
  // kimlikleri çakışmaz (sabit id'lerle ikinci logo bozuluyordu).
  const uid = useId().replace(/[:»]/g, "");
  const g = (n: string) => `${n}-${uid}`;

  const mark = (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block", flexShrink: 0 }}
      role="img" aria-label="Sompo">
      <defs>
        <radialGradient id={g("sphere")} cx="30%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#F2536B" />
          <stop offset="18%" stopColor="#E4173A" />
          <stop offset="55%" stopColor="#C8102E" />
          <stop offset="100%" stopColor="#7A0716" />
        </radialGradient>
        <linearGradient id={g("ring")} x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#FCFCFC" />
          <stop offset="22%" stopColor="#C9C9C9" />
          <stop offset="46%" stopColor="#7E7E7E" />
          <stop offset="68%" stopColor="#BFBFBF" />
          <stop offset="100%" stopColor="#EDEDED" />
        </linearGradient>
        <radialGradient id={g("gloss")} cx="30%" cy="26%" r="36%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.58" />
          <stop offset="58%" stopColor="#FFFFFF" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        {/* Halkanın kürenin ÖNÜNDE kalan yarısı: y > x + 15.75 bölgesi */}
        <clipPath id={g("front")}>
          <polygon points="-10,5.75 94.25,110 -10,110" />
        </clipPath>
      </defs>

      {/* 1 — Halkanın arka yayı */}
      <circle cx="53" cy="47" r="33" fill="none" stroke={`url(#${g("ring")})`} strokeWidth="6" />
      {/* 2 — Küre (arka yayı örter) */}
      <circle cx="47" cy="53" r="30" fill={`url(#${g("sphere")})`} />
      <circle cx="47" cy="53" r="30" fill={`url(#${g("gloss")})`} />
      {/* 3 — Halkanın ön yayı geri gelir; altındaki koyu kenar derinlik verir */}
      <g clipPath={`url(#${g("front")})`}>
        <circle cx="53" cy="47" r="33" fill="none" stroke="#5A0410" strokeWidth="6.8" opacity="0.22" />
        <circle cx="53" cy="47" r="33" fill="none" stroke={`url(#${g("ring")})`} strokeWidth="6" />
      </g>
    </svg>
  );

  if (!withText) return mark;

  return (
    <div style={{
      display: "flex",
      flexDirection: stacked ? "column" : "row",
      alignItems: "center",
      gap: stacked ? size * 0.06 : size * 0.22,
    }}>
      {mark}
      <span style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontSize: size * (stacked ? 0.30 : 0.50),
        fontWeight: 700,
        color: wordColor || "#161616",
        letterSpacing: size * 0.028,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}>SOMPO</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//                          BLOCK PRIMITIVE
// (Belgedeki standart blok yapısı: harfli rozet + bordo italic başlık + silver caption sağ)
// ════════════════════════════════════════════════════════════════════
function Block({ idx, title, sub, children, padded = true }:
  { idx: string; title: string; sub?: string; children?: any; padded?: boolean }) {
  return (
    <section style={{ background: T.white, marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <span style={{
          width: 26, height: 26, border: `1.5px solid ${T.red}`,
          fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.red,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>{idx}</span>
        <h3 style={{
          margin: 0, fontFamily: T.display, fontSize: 22, fontWeight: 500,
          fontStyle: "italic", color: T.red, letterSpacing: -0.3,
        }}>{title}</h3>
        {sub && <span style={{ marginLeft: "auto", fontFamily: T.body, fontSize: 11.5, color: T.silver, letterSpacing: 0.2 }}>{sub}</span>}
      </div>
      <div style={{ paddingLeft: padded ? 0 : 0 }}>{children}</div>
    </section>
  );
}

// ─── Common card frame ─────────────────────────────────────────────
function StatCard({ label, value, sub, accent, big = false, filled = false, soft }:
  { label: string; value: any; sub?: any; accent?: string; big?: boolean; filled?: boolean; soft?: string }) {
  return (
    <div style={{
      background: filled ? T.red : (soft || T.white),
      borderTop: accent ? `3px solid ${accent}` : `1px solid ${T.rule}`,
      borderRight: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}`, borderLeft: `1px solid ${T.rule}`,
      padding: big ? "16px 18px" : "12px 14px",
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, color: filled ? T.onBrand : T.silver, letterSpacing: 1.5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: T.mono, fontSize: big ? 26 : 22, fontWeight: 600, color: filled ? T.white : T.red, marginTop: 6, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontFamily: T.body, fontSize: 11, color: filled ? T.onBrand : T.inkMute, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Field row (Stage I/II display) ────────────────────────────────
function FieldRow({ label, value, valueColor, italic = true }:
  { label: string; value: any; valueColor?: string; italic?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: `1px solid ${T.ruleSoft}` }}>
      <span style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft }}>{label}</span>
      <span style={{
        fontFamily: italic ? T.body : T.mono, fontSize: 12, fontWeight: 600,
        color: valueColor || T.ink, fontStyle: italic && valueColor ? "italic" : "normal",
      }}>{value}</span>
    </div>
  );
}

// ─── Status pill (OK / NO / amber) ─────────────────────────────────
function Pill({ status }: { status: "OK" | "NO" | "ŞARTLI" | "DİKKAT" }) {
  const cfg = {
    OK: { bg: T.greenSoft, fg: T.green, br: T.green },
    NO: { bg: T.redSoft, fg: T.red, br: T.red },
    ŞARTLI: { bg: T.amberSoft, fg: T.amber, br: T.amber },
    DİKKAT: { bg: T.amberSoft, fg: T.amber, br: T.amber },
  }[status];
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "3px 10px",
      background: cfg.bg, color: cfg.fg, border: `1px solid ${cfg.br}`,
      letterSpacing: 1,
    }}>{status}</span>
  );
}

// ════════════════════════════════════════════════════════════════════
//        YETKİ KATMANLARI — Rol / otorizasyon simülasyonu
// (Sunum modu: her rol seçildiğinde görev + yetki + sınır canlı görünür)
// ════════════════════════════════════════════════════════════════════
// Kademeler: Gelişim Planı v2 §2.1 dual-track kariyer mimarisi + üstüne GMY & Reasürans
// chain = bağlayıcı onay zincirinde mi? (Yol B teknik track danışmandır, zincirde değildir)
type Role = {
  id: string; level: number; name: string; title: string; track: string; code: string;
  chain: boolean; color: string; bg: string;
  gorev: string; yapabilir: string[]; yapamaz: string[]; limit: string; terfi: string;
};

const ROLES: Role[] = [
  {
    id: "yrduw", level: 1, name: "Yardımcı UW", title: "Gözlemci / Asistan Dönem", track: "ORTAK", code: "Y.UW", chain: true,
    color: T.inkMute, bg: T.silverBg,
    gorev: "Ortak başlangıç kademesi. Ay 1–6 gözlemci, Ay 7–12 asistan olarak kıdemli UW gözetiminde çalışır; bağımsız karar vermez, hazırlık ve portföy takibine destek olur.",
    yapabilir: [
      "Kıdemli gözetiminde teklif hazırlığına destek",
      "Portföy takip tablosu güncelleme (Ay 7+)",
      "İş ortağı görüşmelerinde gözlem + debrief",
      "Yeşil kuşak dosyada ön veri girişi",
    ],
    yapamaz: [
      "Bağımsız teklif onayı",
      "İş ortağıyla bağımsız temas (Ay 1–6)",
      "Sarı / kırmızı kuşak dosya yönetimi",
    ],
    limit: "Ay 1–6 gözlemci · Ay 7–12 onay hattı · bağımsız karar yok",
    terfi: "→ UW: min 12 ay · ≥200 yeşil kuşak dosya · SYMYS-101 + PPYT-1 ≥70",
  },
  {
    id: "uw", level: 2, name: "Underwriter (UW)", title: "Yeşil Kuşak Underwriter", track: "ORTAK", code: "UW", chain: true,
    color: "#1565C0", bg: T.blueSoft,
    gorev: "Yeşil kuşak dosyaları bağımsız değerlendirir ve BDL altında teklif hazırlar/onaylar. Yetki dışı kalemleri kıdemli/lider kademeye yönlendirir.",
    yapabilir: [
      "Yeşil kuşak dosyada bağımsız değerlendirme",
      "BDL altı bedel ile teklif hazırlama",
      "Standart komisyon ile fiyatlama",
      "RT başlatma talebi · saha beyanı girişi",
      "Platform: eskalasyon ve hata bildirimi (PPYT-1)",
    ],
    yapamaz: [
      "Sarı / kırmızı kuşak nihai onayı",
      "BDL üstü bedel · komisyon tavanı aşımı",
      "Fakülte teyidi · stratejik eşik",
    ],
    limit: "Yeşil kuşak · BDL altı · standart komisyon",
    terfi: "→ Kıdemli UW: min 18 ay (30 ay top.) · ≥30 sarı dosya + 4 saha · SYMYS-201 + PPYT-2 ≥70",
  },
  {
    id: "kiduw", level: 3, name: "Kıdemli UW", title: "Sarı/Kırmızı Dosya + Mentor", track: "ORTAK · ÇATAL", code: "K.UW", chain: true,
    color: "#0D47A1", bg: T.blueSoft,
    gorev: "Sarı ve kırmızı kuşak dosyaları yönetir, junior UW'lere mentorluk yapar, ground truth etiketler ve ajan kalibrasyonuna katılır. Kariyerin çatallandığı kademe (Yol A / Yol B tercihi).",
    yapabilir: [
      "Sarı kuşak dosyada nihai onay",
      "Komisyon revizyonu (orta bant)",
      "Ground truth etiketleme + zor vaka yönetimi",
      "Junior mentorluğu, RT raporu değerlendirme",
      "Gerekçeli override kararı",
    ],
    yapamaz: [
      "Kırmızı/sektör uzman dosyada tek başına bağlama",
      "BDL üstü kapasite onayı",
      "Fakülte teyidi · stratejik eşik",
    ],
    limit: "Sarı kuşak · orta komisyon · BDL içi",
    terfi: "→ Lider UW: min 24 ay + büyüme planı + SYMYS-301 & ASC ≥72  |  veya → Baş UW (Yol B): sektör rehberi + 50 etiket + Tek. Yeterlik ≥75",
  },
  {
    id: "lideruw", level: 4, name: "Lider UW", title: "Yol A · Yönetim Kademesi", track: "YOL A · YÖNETİM", code: "L.UW", chain: true,
    color: T.red, bg: T.redTint,
    gorev: "Yönetim yolunun ilk kademesi. Kırmızı/sektör uzman dosyaları yönetir, override kalitesini denetler, ekip portföyü ve iş ortağı büyüme planından sorumludur.",
    yapabilir: [
      "Kırmızı kuşak / sektör uzman dosyada nihai onay",
      "Override kalite örneklemesi (%20) ve skorlama",
      "Komisyon tavanı belirleme",
      "Ground truth çakışma protokolünde nihai karar",
      "Validasyon seti ve ajan pilot izleme",
    ],
    yapamaz: [
      "BDL üstü kapasite bağlama (GMY)",
      "Fakülte teknik teyidi (Reasürans)",
      "Portföy stratejisi / appetite belirleme (Kıdemli Müdür)",
    ],
    limit: "Kırmızı kuşak · komisyon tavanı · ekip portföyü · BDL içi",
    terfi: "→ Kıdemli Müdür: min 12 ay Lider UW · Müdürlük Assessment + OŞS",
  },
  {
    id: "kidemlimudur", level: 5, name: "Kıdemli Müdür", title: "Yangın Teknik Kabul Müdürü · Departman Zirvesi", track: "YÖNETİM · DEPARTMAN", code: "K.MD", chain: true,
    color: T.redDeep, bg: T.redTint,
    gorev: "Departman onay merciinin başı (Mustafa Arslan). Tüm bölgelerin bağlayıcı onay zincirinde Lider UW üstü son departman mercii. Portföy stratejisi, underwriting appetite, treaty optimizasyonu ve kanal ekosisteminden sorumludur. Yetkisini aşan kapasite/eşik işlerini GMY'ye taşır.",
    yapabilir: [
      "Tüm bantlarda nihai departman onayı (BDL içi)",
      "Underwriting appetite ve portföy stratejisi",
      "Treaty optimizasyonu ve komisyon politikası",
      "Pilot / rollback ve kırmızı alarm yönetimi",
      "İş ortağı çıkış kararı · ekip yetki tahsisi",
    ],
    yapamaz: [
      "BDL üstü kapasite tek başına bağlama → GMY",
      "Stratejik eşik aşımı tek başına → GMY",
      "Fakülte teknik teyidi (Reasürans paralel)",
    ],
    limit: "Tüm bantlar · appetite · BDL içi kapasite — aşımda GMY",
    terfi: "Departman yönetim zirvesi — üstü GMY (sisteme tanımlı son teknik merci)",
  },
  {
    id: "basuw", level: 4, name: "Baş Underwriter", title: "Yol B · Teknik Otorite", track: "YOL B · TEKNİK", code: "B.UW", chain: false,
    color: "#5E35B1", bg: "#EDE7F6",
    gorev: "Teknik uzman yolunun kademesi — yönetici değildir. Sektör tehlike profilleri, PML hesabı ve standart dışı yapılandırmada danışılan teknik otoritedir; sektör rehberleri yazar.",
    yapabilir: [
      "Kompleks / standart dışı rizikoda teknik teyit (danışman)",
      "Sektör rehberi ve bilgi mimarisi yazımı (RAG besleme)",
      "PML / MFL hesabı ve özel koşul tasarımı",
      "Ajan bilgi tabanına içerik üretimi",
    ],
    yapamaz: [
      "Bağlayıcı onay (ekip yönetmez, zincirde değil)",
      "Komisyon / appetite belirleme",
      "Müşteri fiyatı bağlama",
    ],
    limit: "Teknik otorite · danışman · bağlayıcı onay yok",
    terfi: "→ Kıdemli Baş UW: ileri teknik yeterlik · KMS · sektör metodoloji standartları",
  },
  {
    id: "kidembasuw", level: 5, name: "Kıdemli Baş UW", title: "Yol B · Üst Teknik Otorite", track: "YOL B · TEKNİK", code: "KB.UW", chain: false,
    color: "#4527A0", bg: "#EDE7F6",
    gorev: "Teknik uzman yolunun zirvesi — şirket dışına danışılan teknik otorite. Ajan ekosistemi bilgi mimarisi ve en kompleks rizikolarda nihai teknik görüş verir.",
    yapabilir: [
      "En kompleks rizikoda nihai teknik görüş",
      "Ajan ekosistemi bilgi mimarisi tasarımı",
      "Sektör metodoloji standartları (KMS yakını)",
      "Çapraz-departman teknik danışmanlık",
    ],
    yapamaz: [
      "Bağlayıcı onay (zincirde değil)",
      "Yönetimsel / ticari karar",
    ],
    limit: "En üst teknik otorite · danışman · bağlayıcı onay yok",
    terfi: "Teknik uzman yolu zirvesi — şirket dışı danışılan otorite",
  },
  {
    id: "gmy", level: 6, name: "Endüstriyel Riskler GMY", title: "Sisteme Tanımlı Son Teknik Merci", track: "ÜST KADEME", code: "GMY", chain: true,
    color: T.amber, bg: T.amberSoft,
    gorev: "Kıdemli Müdür'ün de yetkisini aşan işlerin gittiği en üst teknik onay mercii. BDL üstü kapasiteyi, stratejik eşik aşımını ve dikkatli bant istisnalarını onaylar. Üstünde CEO bulunur ancak CEO onay sistemine tanımlı değildir — en üst teknik yetki GMY'dedir.",
    yapabilir: [
      "BDL üstü bedel / kapasite onayı",
      "Stratejik portföy eşiği aşımı onayı",
      "Yüksek komisyon istisnası",
      "Dikkatli (turuncu) bantta nihai karar",
    ],
    yapamaz: [
      "Fakülte teknik teyidi (Reasürans birimine bağlı)",
      "İştah dışı / kırmızı çizgi riski tek başına bağlama",
    ],
    limit: "BDL üstü · stratejik istisna · turuncu bant — sistemin en üst teknik mercii",
    terfi: "Üst yönetim ataması (üstü: CEO — sisteme tanımlı değil)",
  },
  {
    id: "reas", level: 7, name: "Reasürans Birimi", title: "Fakülte & Treaty Kapasite", track: "ÜST KADEME", code: "REAS", chain: true,
    color: T.green, bg: T.greenSoft,
    gorev: "Treaty kapasitesini yönetir ve BDL'yi aşan rizikolarda fakülte (ihtiyari) reasürans teyidini sağlar. Kapasite teyidi olmadan poliçeleşme tamamlanmaz.",
    yapabilir: [
      "Fakülte (ihtiyari) reasürans teyidi",
      "Treaty kapasite tahsisi",
      "Reasürör komisyon oranı müzakeresi",
      "Kümül / akümülasyon kontrolü",
    ],
    yapamaz: [
      "Teknik kabul / iştah kararı (UW–Lider–K.Müdür–GMY zinciri)",
      "Müşteri fiyatı belirleme",
    ],
    limit: "Kapasite & fakülte · reasürör komisyonu · kümül kontrol",
    terfi: "Merkezi reasürans fonksiyonu",
  },
];

// Bir teklif için gereken minimum yetki seviyesini ve gerekçelerini hesaplar
function offerAuthority(offer: Offer): { req: number; reasons: string[] } {
  let req = 2; const reasons: string[] = [];
  if (offer.appetiteBand === "İŞTAH DAHİLİNDE") { reasons.push("İştah dahilinde · yeşil kuşak → UW yeterli"); }
  if (offer.appetiteBand === "ŞARTLI") { req = Math.max(req, 3); reasons.push("Şartlı · sarı kuşak → Kıdemli UW"); }
  if (offer.appetiteBand === "DİKKATLİ") { req = Math.max(req, 4); reasons.push("Dikkatli · kırmızı kuşak → Lider UW"); }
  if (offer.appetiteBand === "İŞTAH DIŞI") { req = 99; reasons.push("İştah dışı → kabul edilemez / komite"); }
  offer.flags.forEach(f => {
    const fl = f.toLocaleLowerCase("tr");
    if (fl.includes("bdl") || fl.includes("bedel")) { req = Math.max(req, 6); reasons.push("BDL / bedel aşımı → GMY"); }
    if (fl.includes("fak")) { req = Math.max(req, 7); reasons.push("Fakülte zorunlu → Reasürans teyidi"); }
    if (fl.includes("komisyon")) { req = Math.max(req, 4); reasons.push("Komisyon aşımı → Lider UW+"); }
    if (fl.includes("stratej") || fl.includes("eşik")) { req = Math.max(req, 5); reasons.push("Stratejik eşik → Kıdemli Müdür"); }
    if (fl.includes("konservasyon")) { req = Math.max(req, 6); reasons.push("Konservasyon yetersiz → GMY/Reas"); }
    if (fl.includes("kırmızı")) { req = 99; reasons.push("Kırmızı çizgi → kabul edilemez"); }
  });
  return { req, reasons };
}

function RoleBar({ offer }: { offer?: Offer }) {
  const [roleId, setRoleId] = useState<string>("kidemlimudur");
  const [expanded, setExpanded] = useState<boolean>(true);
  const role = ROLES.find(r => r.id === roleId) || ROLES[2];
  const chainRoles = ROLES.filter(r => r.chain);
  const isAdvisory = !role.chain;
  const auth = offer ? offerAuthority(offer) : null;
  const esc = offer ? escalationPath(offer) : null;
  const canApprove = auth ? (auth.req !== 99 && role.chain && role.level >= auth.req) : null;
  const reqRole = auth && auth.req !== 99 ? ROLES.find(r => r.chain && r.level === Math.min(auth.req, 7)) : null;

  // Seçili kademeye karşılık gelen gerçek ekip üyeleri + 2026 yetki profili
  const roleToAuthKeys: Record<string, string[]> = {
    kidemlimudur: ["manager"],
    lideruw: ["teamlead", "teamlead_l7"],
    kiduw: ["senioruw", "uw_l7", "uw_l8"],
    uw: ["uw_l8", "asistuw_l10"],
    yrduw: ["asistuw_l13"],
  };
  const realMembers = TEAM.filter(t => t.roleId === roleId);
  const selfMember = roleId === "kidemlimudur" ? [{ name: SELF.name, authKey: SELF.authKey, regionId: "—" }] : [];
  const shownMembers = roleId === "kidemlimudur" ? selfMember : realMembers;
  const sampleAuthKey = (roleToAuthKeys[roleId] && roleToAuthKeys[roleId][0]) || null;
  const fmtTL = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 2) + " Mlr" : (n / 1e6).toFixed(0) + " mio";

  return (
    <section style={{ background: T.silverBg, borderBottom: `1px solid ${T.rule}`, borderTop: `1px solid ${T.rule}` }}>
      <style>{`@keyframes roleFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 28px" }}>
        {/* başlık satırı */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", background: T.red, color: T.white }}>YETKİ KATMANI SİMÜLASYONU</span>
          <span style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft }}>Kademe = <strong>dikey yetki ekseni</strong>; iş operasyonda <strong>bölge bazlı paralel</strong> akar (aşağıdaki ekip dağılımı), kademe yalnız yetki aşımında devreye girer. Bir rol seç → görev ve sınırlarını gör. {offer ? "Bu teklif için onay yetkisi sağda hesaplanır." : ""}</span>
          <button onClick={() => setExpanded(!expanded)} style={{
            marginLeft: "auto", fontFamily: T.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.8,
            padding: "5px 12px", background: "transparent", color: T.red, border: `1px solid ${T.red}`, cursor: "pointer",
          }}>{expanded ? "ÖZETİ GİZLE −" : "ÖZETİ GÖSTER +"}</button>
        </div>

        {/* rol çipleri */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ROLES.map(r => {
            const active = r.id === roleId;
            return (
              <button key={r.id} onClick={() => setRoleId(r.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "8px 14px 8px 8px",
                background: active ? r.color : T.white,
                border: `1.5px solid ${active ? r.color : T.rule}`,
                cursor: "pointer", transition: "all 0.15s ease",
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: active ? T.white : r.bg, color: active ? r.color : r.color,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                }}>{r.level}</span>
                <span style={{ textAlign: "left" }}>
                  <span style={{ display: "block", fontFamily: T.body, fontSize: 12, fontWeight: 600, color: active ? T.white : T.ink, lineHeight: 1.1 }}>{r.name}</span>
                  <span style={{ display: "block", fontFamily: T.mono, fontSize: 8.5, letterSpacing: 0.4, color: active ? "rgba(255,255,255,0.85)" : T.silver, marginTop: 2 }}>{r.title.toUpperCase()}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* özet + (detayda) teklif yetki verdict'i */}
        {expanded && (
          <div key={roleId + (offer ? offer.ref : "")} style={{
            marginTop: 14, display: "grid", gridTemplateColumns: offer ? "1.5fr 1fr" : "1fr", gap: 18,
            animation: "roleFadeUp 0.25s ease",
          }}>
            {/* GÖREV & YETKİ KARTI */}
            <div style={{ background: T.white, border: `1px solid ${T.rule}`, borderTop: `3px solid ${role.color}`, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.5, fontWeight: 600 }}>SEVİYE {role.level} · {role.title.toUpperCase()}</span>
                <span style={{ fontFamily: T.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: 1, padding: "2px 7px", background: role.bg, color: role.color }}>{role.track}</span>
                {!role.chain && <span style={{ fontFamily: T.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: 0.5, padding: "2px 7px", border: `1px solid ${role.color}`, color: role.color }}>DANIŞMAN · ZİNCİR DIŞI</span>}
              </div>
              <div style={{ fontFamily: T.display, fontSize: 22, fontStyle: "italic", fontWeight: 500, color: role.color, marginTop: 4, letterSpacing: -0.3 }}>{role.name}</div>
              <p style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft, lineHeight: 1.55, margin: "8px 0 10px" }}>{role.gorev}</p>
              <div style={{ display: "flex", gap: 8, padding: "8px 12px", background: T.silverBg, border: `1px solid ${T.rule}`, marginBottom: 12 }}>
                <span style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1, fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>TERFİ ŞARTI</span>
                <span style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkSoft, lineHeight: 1.4 }}>{role.terfi}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.green, letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>✓ YAPABİLİR</div>
                  {role.yapabilir.map((y, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, padding: "3px 0", fontFamily: T.body, fontSize: 11, color: T.inkSoft, lineHeight: 1.4 }}>
                      <span style={{ color: T.green, flexShrink: 0 }}>•</span><span>{y}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>✕ YAPAMAZ</div>
                  {role.yapamaz.map((y, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, padding: "3px 0", fontFamily: T.body, fontSize: 11, color: T.inkMute, lineHeight: 1.4 }}>
                      <span style={{ color: T.red, flexShrink: 0 }}>•</span><span>{y}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", background: role.bg, borderLeft: `3px solid ${role.color}` }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: role.color, letterSpacing: 1, fontWeight: 700 }}>YETKİ SINIRI:</span>
                <span style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft, marginLeft: 6 }}>{role.limit}</span>
              </div>

              {/* GERÇEK 2026 YETKİ MEKTUBU VERİSİ */}
              {sampleAuthKey && AUTH[sampleAuthKey] && (
                <div style={{ marginTop: 12, border: `1px solid ${T.rule}`, borderTop: `2px solid ${T.redDeep}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: T.silverBg, borderBottom: `1px solid ${T.rule}` }}>
                    <span style={{ fontFamily: T.mono, fontSize: 8.5, color: T.redDeep, letterSpacing: 1.2, fontWeight: 700 }}>GERÇEK YETKİ · 2026 AUTHORITY LETTER</span>
                    <span style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver }}>{TITLES[sampleAuthKey]} · L{AUTH[sampleAuthKey].authLevel}</span>
                  </div>
                  {/* gerçek ekip üyeleri */}
                  {shownMembers.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${T.ruleSoft}` }}>
                      {shownMembers.map((mem: any) => {
                        const ma = AUTH[mem.authKey];
                        const reg = REGIONS.find(rr => rr.id === mem.regionId);
                        return (
                          <span key={mem.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", background: T.white, border: `1px solid ${T.rule}`, borderLeft: `3px solid ${role.color}` }}>
                            <span style={{ fontFamily: T.body, fontSize: 10.5, fontWeight: 600, color: T.ink }}>{mem.name}</span>
                            {reg && <span style={{ fontFamily: T.mono, fontSize: 8, color: T.silver }}>{reg.name}</span>}
                            <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: role.color }}>L{ma.authLevel}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Yangın tarife limit bandı + komisyon */}
                  <div style={{ padding: "8px 12px" }}>
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: T.silver, letterSpacing: 1, fontWeight: 600, marginBottom: 5 }}>YANGIN AZAMİ BEDEL YETKİSİ (TL) · T1→T6</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
                      {AUTH[sampleAuthKey].fireLimits.map((v, i) => (
                        <div key={i} style={{ border: `1px solid ${T.rule}`, padding: "4px 2px", textAlign: "center" }}>
                          <div style={{ fontFamily: T.mono, fontSize: 7.5, color: T.silver }}>T{i + 1}</div>
                          <div style={{ fontFamily: T.mono, fontSize: 9.5, fontWeight: 700, color: T.red }}>{fmtTL(v)}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontFamily: T.body, fontSize: 10, color: T.inkSoft }}>
                      <span>3.Şahıs MM: <strong style={{ color: T.ink }}>{fmtTL(AUTH[sampleAuthKey].tpl)}</strong></span>
                      <span>İşveren (olay): <strong style={{ color: T.ink }}>{fmtTL(AUTH[sampleAuthKey].empOcc)}</strong></span>
                      <span>EE+MK: <strong style={{ color: T.ink }}>{fmtTL(AUTH[sampleAuthKey].eeMb)}</strong></span>
                      <span>Komisyon T1/T4: <strong style={{ color: T.ink }}>%{AUTH[sampleAuthKey].commission[0]} / %{AUTH[sampleAuthKey].commission[3]}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TEKLİF YETKİ VERDICT'İ — yalnız detay görünümünde */}
            {offer && auth && (
              <div style={{ background: T.white, border: `1px solid ${T.rule}`, padding: "14px 16px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.5, fontWeight: 600 }}>BU TEKLİF İÇİN · {offer.ref}</div>
                {esc && (
                  <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 5, padding: "6px 10px", background: T.silverBg, borderLeft: `3px solid ${esc.ownerRole.color}` }}>
                    Bölge: <strong style={{ color: T.red }}>{esc.region.name}</strong> · Sahip: <strong>{esc.owner.name}</strong> <span style={{ fontFamily: T.mono, fontSize: 9, color: esc.ownerRole.color, fontWeight: 700 }}>{esc.ownerRole.code}</span>
                    <span style={{ color: T.silver }}> · {esc.ownerRole.name}</span>
                  </div>
                )}

                {/* yetki merdiveni — bağlayıcı onay zinciri */}
                <div style={{ display: "flex", gap: 3, marginTop: 12 }}>
                  {chainRoles.map(r => {
                    const isCurrent = !isAdvisory && r.level === role.level;
                    const isRequired = auth.req !== 99 && r.level === Math.min(auth.req, 7);
                    return (
                      <div key={r.id} style={{ flex: 1, textAlign: "center", position: "relative", paddingTop: 12 }}>
                        {isRequired && (
                          <div style={{ position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)", fontFamily: T.mono, fontSize: 7, color: T.red, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap" }}>GEREKLİ ▾</div>
                        )}
                        <div style={{
                          height: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          fontFamily: T.mono, fontWeight: 700, lineHeight: 1,
                          background: isCurrent ? r.color : r.bg,
                          color: isCurrent ? T.white : r.color,
                          border: isRequired ? `2px dashed ${T.red}` : `1px solid ${T.rule}`,
                        }}>
                          <span style={{ fontSize: 10 }}>{r.level}</span>
                          <span style={{ fontSize: 6.5, letterSpacing: 0.2, marginTop: 1 }}>{r.code}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 7.5, color: T.silver, letterSpacing: 0.3, textAlign: "center", marginTop: 4 }}>BAĞLAYICI ONAY ZİNCİRİ · Y.UW → UW → K.UW → L.UW → K.MD → GMY ⫶ REAS (paralel)</div>
                {isAdvisory && (
                  <div style={{ fontFamily: T.body, fontSize: 10, color: role.color, textAlign: "center", marginTop: 4, fontStyle: "italic" }}>▸ {role.name} · Yol B teknik track — onay zincirinde değil</div>
                )}

                {/* verdict */}
                <div style={{
                  marginTop: 12, padding: "12px 14px",
                  background: auth.req === 99 ? T.redTint : isAdvisory ? T.blueSoft : canApprove ? T.greenSoft : T.amberSoft,
                  borderLeft: `4px solid ${auth.req === 99 ? T.red : isAdvisory ? role.color : canApprove ? T.green : T.amber}`,
                }}>
                  {auth.req === 99 ? (
                    <>
                      <div style={{ fontFamily: T.display, fontSize: 16, fontStyle: "italic", fontWeight: 600, color: T.red }}>✕ Kabul eşiği dışı</div>
                      <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}>Tek bir kademe onaylayamaz — komite kararı veya red.</div>
                    </>
                  ) : isAdvisory ? (
                    <>
                      <div style={{ fontFamily: T.display, fontSize: 16, fontStyle: "italic", fontWeight: 600, color: role.color }}>◇ Teknik otorite</div>
                      <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}>Danışman rol — bağlayıcı onaya giremez. {offer.tarife >= 4 ? "Bu riziko (tarife sınıfı " + offer.tarife + ") teknik teyide uygun." : "Kompleks rizikolarda teknik teyit verir."}</div>
                    </>
                  ) : canApprove ? (
                    <>
                      <div style={{ fontFamily: T.display, fontSize: 16, fontStyle: "italic", fontWeight: 600, color: T.green }}>✓ Onay yetkiniz VAR</div>
                      <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}><strong>{role.name}</strong> bu teklifi bağlayabilir.</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: T.display, fontSize: 16, fontStyle: "italic", fontWeight: 600, color: T.amber }}>△ Yetki yetersiz</div>
                      <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}>En az <strong>{reqRole?.name}</strong> kademesi gerekir — bir üst kademeye yönlendirin.</div>
                    </>
                  )}
                </div>

                {/* gerekçeler */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.2, fontWeight: 600, marginBottom: 5 }}>OTORİZASYON GEREKÇELERİ</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {auth.reasons.map((rn, i) => (
                      <span key={i} style={{ fontFamily: T.body, fontSize: 9.5, padding: "3px 7px", background: T.silverBg, color: T.inkSoft, border: `1px solid ${T.rule}` }}>{rn}</span>
                    ))}
                  </div>
                </div>

                {/* eskalasyon yolu — bölgeden yetkiliye somut rota */}
                {esc && (
                  <div style={{ marginTop: 12, borderTop: `1px solid ${T.rule}`, paddingTop: 10 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 }}>ESKALASYON YOLU · BÖLGEDEN YETKİLİYE</div>
                    {esc.steps.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", paddingBottom: i < esc.steps.length - 1 ? 14 : 0 }}>
                        {i < esc.steps.length - 1 && <div style={{ position: "absolute", left: 13, top: 22, bottom: 0, borderLeft: `1.5px dashed ${T.silverLight}` }} />}
                        <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: s.color, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.mono, fontSize: 7.5, fontWeight: 700, zIndex: 1 }}>{s.code}</div>
                        <div style={{ flex: 1, fontFamily: T.body, fontSize: 11.5, fontWeight: 600, color: T.ink }}>{s.name}</div>
                        <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: 0.4, padding: "3px 8px", background: s.sc === T.green ? T.greenSoft : s.sc === T.red ? T.redTint : s.sc === T.blue ? T.blueSoft : T.amberSoft, color: s.sc }}>{s.status}</span>
                      </div>
                    ))}
                    <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 8, fontStyle: "italic", lineHeight: 1.4 }}>
                      {esc.req === 99
                        ? `${esc.owner.name} dosyayı hazırlar ama hiçbir kademe tek başına bağlayamaz — Teknik Komite'ye gider / reddedilir.`
                        : esc.ownerRole.level >= esc.req
                          ? `${esc.owner.name} bu teklifi kendi yetkisiyle bağlayabilir — eskalasyon gerekmez.`
                          : `${esc.owner.name} (${esc.ownerRole.name}) yetkisini aşar; dosyayı hazırlayıp bağlayıcı kademeye devreder.`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
//        BÖLGE BAZLI EKİP MODELİ — operasyonel yatay eksen
// İş tek banttan akmaz: her bölgenin kendi sorumlu UW'si var. Risk tier'ı yükseldikçe
// atanan kademe yükselir — 3 Lider UW yüksek tier, 4 Kıdemli UW orta tier, 2 UW orta,
// 1 Yrd. UW düşük tier bölgede. Sahibi Lider olmayan bölge yetki aşımında mentor Lider'e devreder.
// ════════════════════════════════════════════════════════════════════
const REGIONS = [
  { id: "ankara", name: "Ankara", tier: "YÜKSEK", zones: "B3–B4", cities: "Ankara · Kırıkkale · Çankırı", open: 34, kumul: 6.8 },
  { id: "ege", name: "Ege", tier: "YÜKSEK", zones: "B1–B2", cities: "İzmir · Manisa · Denizli · Aydın", open: 31, kumul: 5.9 },
  { id: "anadolu2", name: "Anadolu 2", tier: "YÜKSEK", zones: "B2–B4", cities: "Konya · Kayseri · Sivas · Eskişehir", open: 29, kumul: 5.2 },
  { id: "avrupa1", name: "Avrupa 1", tier: "YÜKSEK", zones: "B1", cities: "İkitelli · Esenyurt · Hadımköy · Avcılar", open: 33, kumul: 6.1 },
  { id: "gab", name: "GAB (Güneydoğu)", tier: "ORTA", zones: "B5–B6", cities: "Gaziantep · Adıyaman · Şanlıurfa", open: 21, kumul: 3.1 },
  { id: "akdeniz", name: "Akdeniz", tier: "ORTA", zones: "B2–B3", cities: "Adana · Mersin · Antalya · Hatay", open: 26, kumul: 4.4 },
  { id: "avrupa2", name: "Avrupa 2", tier: "ORTA", zones: "B1", cities: "Çerkezköy · Çorlu · Edirne · Tekirdağ", open: 24, kumul: 4.0 },
  { id: "banka", name: "Banka", tier: "ORTA", zones: "Karma", cities: "Banka kanalı · ülke geneli portföy", open: 19, kumul: 3.3 },
  { id: "marmara", name: "Marmara", tier: "ORTA", zones: "B1", cities: "Kocaeli · Bursa · Sakarya · Yalova", open: 28, kumul: 4.6 },
  { id: "anadolu1", name: "Anadolu 1", tier: "ORTA", zones: "B1", cities: "Tuzla · Gebze · Pendik · Kartal", open: 27, kumul: 4.2 },
  { id: "mbm-obk-kdz", name: "MBM · OBK · KDZ", tier: "DÜŞÜK", zones: "B4–B7", cities: "Samsun · Trabzon · Ordu · iç bölgeler", open: 12, kumul: 1.1 },
];

// ════════════════════════════════════════════════════════════════════
//   GERÇEK YETKİ VERİSİ — 2026 Authority Letters (sistemin source of truth)
//   Sompo Kurumsal UW · Industrial Risks – Property · 01.01–31.12.2026
//   ⚠ Authority Level TERS ölçektir: düşük sayı = yüksek yetki (L2 en güçlü)
//   En üst merci: CUO (Uğur Özer) — Senior Manager'ın da üstü, son onay.
// ════════════════════════════════════════════════════════════════════
type AuthProfile = {
  authLevel: number;            // gerçek sistem seviyesi (düşük = güçlü)
  fireLimits: number[];         // Yangın T1..T6 limit (TL)
  tpl: number;                  // 3.Şahıs MM olay/yıllık
  empPerson: number; empOcc: number;  // İşveren kişi / olay-yıllık
  fidelity: number;             // Emniyeti Suistimal
  cit: number;                  // Para Nakli
  eeMb: number;                 // EE + Makine Kırılması
  commission: number[];         // Komisyon % T1..T6
};

// Ünvan arketipine göre gerçek limit profilleri (mektuplardan birebir)
const AUTH: Record<string, AuthProfile> = {
  // Senior Manager · L2 — Mustafa Arslan
  manager: { authLevel: 2, fireLimits: [2775e6, 2775e6, 2775e6, 2220e6, 1850e6, 1110e6],
    tpl: 200e6, empPerson: 30e6, empOcc: 100e6, fidelity: 35e6, cit: 35e6, eeMb: 1100e6,
    commission: [32.5, 32.5, 30, 30, 25, 22.5] },
  // Team Leader · L3 — Emine, Veysel, Melek
  teamlead: { authLevel: 3, fireLimits: [1850e6, 1850e6, 1850e6, 1850e6, 1295e6, 740e6],
    tpl: 100e6, empPerson: 20e6, empOcc: 60e6, fidelity: 14e6, cit: 14e6, eeMb: 700e6,
    commission: [25, 25, 25, 22.5, 20, 17.5] },
  // Team Leader · L7 — Turan (TL ünvanı ama L7 yetki bandı)
  teamlead_l7: { authLevel: 7, fireLimits: [740e6, 740e6, 740e6, 555e6, 370e6, 92.5e6],
    tpl: 50e6, empPerson: 7.5e6, empOcc: 30e6, fidelity: 14e6, cit: 14e6, eeMb: 700e6,
    commission: [25, 25, 25, 22.5, 20, 17.5] },
  // Senior Underwriter · L7 — Pınar, Raziye
  senioruw: { authLevel: 7, fireLimits: [740e6, 740e6, 740e6, 555e6, 370e6, 92.5e6],
    tpl: 50e6, empPerson: 7.5e6, empOcc: 30e6, fidelity: 14e6, cit: 14e6, eeMb: 700e6,
    commission: [25, 25, 25, 22.5, 20, 17.5] },
  // Underwriter · L7 — Fatma Nur (UW ünvanı, L7 limit / düşük komisyon)
  uw_l7: { authLevel: 7, fireLimits: [740e6, 740e6, 740e6, 555e6, 370e6, 92.5e6],
    tpl: 50e6, empPerson: 7.5e6, empOcc: 30e6, fidelity: 10.5e6, cit: 10.5e6, eeMb: 700e6,
    commission: [22.5, 22.5, 22.5, 20, 17.5, 15] },
  // Underwriter · L8 — Ali Rıza, Batuhan
  uw_l8: { authLevel: 8, fireLimits: [555e6, 555e6, 555e6, 370e6, 185e6, 74e6],
    tpl: 50e6, empPerson: 7.5e6, empOcc: 30e6, fidelity: 10.5e6, cit: 10.5e6, eeMb: 700e6,
    commission: [22.5, 22.5, 22.5, 20, 17.5, 15] },
  // Assistant Underwriter · L10 — Burhan
  asistuw_l10: { authLevel: 10, fireLimits: [370e6, 370e6, 370e6, 185e6, 92.5e6, 37e6],
    tpl: 50e6, empPerson: 7.5e6, empOcc: 30e6, fidelity: 14e6, cit: 14e6, eeMb: 700e6,
    commission: [20, 20, 20, 17.5, 15, 1] },
  // Assistant Underwriter · L13 — Yusuf
  asistuw_l13: { authLevel: 13, fireLimits: [185e6, 185e6, 185e6, 74e6, 37e6, 18.5e6],
    tpl: 50e6, empPerson: 7.5e6, empOcc: 30e6, fidelity: 14e6, cit: 14e6, eeMb: 700e6,
    commission: [20, 20, 20, 17.5, 15, 1] },
};

// Gerçek ünvan adları (mektuplardaki Position alanı)
const TITLES: Record<string, string> = {
  manager: "Senior Manager", teamlead: "Team Leader", teamlead_l7: "Team Leader",
  senioruw: "Senior Underwriter", uw_l7: "Underwriter", uw_l8: "Underwriter",
  asistuw_l10: "Assistant Underwriter", asistuw_l13: "Assistant Underwriter",
};

// Kıdemli Müdür (sen) — zincir tepesi, CUO altı
const SELF = { name: "Mustafa Arslan", roleId: "kidemlimudur", authKey: "manager" };

const TEAM = [
  { name: "Turan Gökdemir", roleId: "lideruw", regionId: "ankara", lead: true, authKey: "teamlead_l7" },
  { name: "Emine Moroğlu Yazıcı", roleId: "lideruw", regionId: "ege", lead: true, authKey: "teamlead" },
  { name: "Veysel Aydın", roleId: "lideruw", regionId: "anadolu2", lead: true, authKey: "teamlead" },
  { name: "Melek Çatalyürek", roleId: "lideruw", regionId: "avrupa1", lead: true, authKey: "teamlead" },
  { name: "Fatma Nur Ünlü", roleId: "kiduw", regionId: "gab", lead: true, authKey: "uw_l7" },
  { name: "Ali Rıza Süren", roleId: "kiduw", regionId: "akdeniz", lead: true, authKey: "uw_l8" },
  { name: "Naime Pınar Atay", roleId: "kiduw", regionId: "avrupa2", lead: true, authKey: "senioruw" },
  { name: "Raziye Güneş", roleId: "kiduw", regionId: "banka", lead: true, authKey: "senioruw" },
  { name: "Burhan Özer", roleId: "uw", regionId: "marmara", lead: true, authKey: "asistuw_l10" },
  { name: "Batuhan Kavraz", roleId: "uw", regionId: "anadolu1", lead: true, authKey: "uw_l8" },
  { name: "Yusuf Saçan", roleId: "yrduw", regionId: "mbm-obk-kdz", lead: true, authKey: "asistuw_l13" },
];

function RegionTeamMatrix() {
  const tierMeta: Record<string, { color: string; bg: string }> = {
    "YÜKSEK": { color: T.red, bg: T.redTint },
    "ORTA": { color: T.amber, bg: T.amberSoft },
    "DÜŞÜK": { color: T.green, bg: T.greenSoft },
  };
  const order = ["YÜKSEK", "ORTA", "DÜŞÜK"];
  const kc = (id: string) => TEAM.filter(t => t.roleId === id).length;
  const kademeLegend = [
    { id: "lideruw", label: "Lider UW" },
    { id: "kiduw", label: "Kıdemli UW" },
    { id: "uw", label: "UW" },
    { id: "yrduw", label: "Yardımcı UW" },
  ];

  return (
    <section style={{ background: T.white, borderBottom: `1px solid ${T.rule}` }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "4px 10px", background: T.redDeep, color: T.white }}>BÖLGE BAZLI EKİP DAĞILIMI</span>
          <span style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft }}>İş tek banttan akmaz — her bölge kendi UW'sine <strong>paralel</strong> akar. Risk tier'ı yükseldikçe kademe yükselir; kademe zinciri yalnız <strong>yetki aşımında dikey</strong> devreye girer.</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) 1.7fr", gap: 14, marginBottom: 16 }}>
          {[
            { k: "TOPLAM UW", v: TEAM.length, c: T.red },
            { k: "BÖLGE", v: REGIONS.length, c: T.red },
            { k: "LİDER UW", v: kc("lideruw"), c: T.red },
            { k: "KIDEMLİ UW", v: kc("kiduw"), c: "#0D47A1" },
          ].map((s, i) => (
            <div key={i} style={{ borderTop: `3px solid ${s.c}`, paddingTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>{s.k}</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: s.c, marginTop: 2, lineHeight: 1 }}>{s.v}</div>
            </div>
          ))}
          <div style={{ borderTop: `3px solid ${T.silver}`, paddingTop: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.2, fontWeight: 600, marginBottom: 6 }}>KADEME DAĞILIMI</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {kademeLegend.map(k => {
                const m = ROLES.find(r => r.id === k.id) || ROLES[1];
                return (
                  <span key={k.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: T.body, fontSize: 10.5, color: T.inkSoft }}>
                    <span style={{ width: 9, height: 9, background: m.color, borderRadius: "50%" }} />
                    {k.label} <strong style={{ color: m.color }}>{kc(k.id)}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11.5 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.red}` }}>
              {["BÖLGE", "DEPREM", "AÇIK DOSYA", "KÜMÜL SB", "SORUMLU · ÜNVAN · YETKİ (2026)"].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 2 && i <= 3 ? "right" : "left", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.flatMap(tier => {
              const tm = tierMeta[tier];
              const regions = REGIONS.filter(r => r.tier === tier);
              const tierUw = TEAM.filter(t => regions.some(rr => rr.id === t.regionId)).length;
              return [
                <tr key={tier + "-h"} style={{ background: tm.bg }}>
                  <td colSpan={5} style={{ padding: "6px 12px", fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: tm.color, borderLeft: `3px solid ${tm.color}` }}>
                    {tier} RİSK BÖLGELERİ · {regions.length} bölge · {tierUw} UW
                  </td>
                </tr>,
                ...regions.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                    <td style={{ padding: "10px 10px", borderLeft: `3px solid ${tm.color}` }}>
                      <div style={{ fontWeight: 600, color: T.ink }}>{r.name}</div>
                      <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 2 }}>{r.cities}</div>
                    </td>
                    <td style={{ padding: "10px 10px", fontFamily: T.mono, fontSize: 11, color: tm.color, fontWeight: 600 }}>{r.zones}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono }}>{r.open}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, fontWeight: 600 }}>{r.kumul.toFixed(1)}B ₺</td>
                    <td style={{ padding: "10px 10px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {TEAM.filter(t => t.regionId === r.id).map(t => {
                          const m = ROLES.find(rr => rr.id === t.roleId) || ROLES[1];
                          const a = AUTH[t.authKey];
                          const fireMax = a ? (a.fireLimits[0] / 1e6).toFixed(0) : "—";
                          return (
                            <span key={t.name} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 8px", background: T.white, border: `1px solid ${T.rule}`, borderLeft: `3px solid ${m.color}` }}>
                              {t.lead && <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color }} title="Bölge sorumlusu" />}
                              <span style={{ display: "inline-flex", flexDirection: "column" }}>
                                <span style={{ fontFamily: T.body, fontSize: 11, fontWeight: 600, color: T.ink, lineHeight: 1.2 }}>{t.name}</span>
                                <span style={{ fontFamily: T.body, fontSize: 9, color: T.inkMute, lineHeight: 1.3 }}>{TITLES[t.authKey] || m.name}</span>
                              </span>
                              {a && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, paddingLeft: 6, borderLeft: `1px solid ${T.ruleSoft}` }}>
                                  <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: m.color, background: m.bg, padding: "1px 5px", letterSpacing: 0.3 }} title="Authority Level (düşük = güçlü)">L{a.authLevel}</span>
                                  <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 600, color: T.red }} title="Yangın T1 azami bedel yetkisi">{fireMax}M</span>
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 12, padding: "9px 14px", background: T.silverBg, borderLeft: `3px solid ${T.redDeep}`, fontFamily: T.body, fontSize: 11, color: T.inkSoft, lineHeight: 1.5 }}>
          <strong style={{ color: T.redDeep }}>Eskalasyon merci:</strong> Kıdemli Müdür (Mustafa Arslan) tüm bölgelerin üstünde durur. Bölge sorumlusunun (●) kademesi bir teklifin gerektirdiği yetkiyi aşamazsa, o teklif dikey zincirde bir üst kademeye (Lider UW → Kıdemli Müdür → GMY) taşınır; GMY sisteme tanımlı en üst teknik mercidir. Reasürans, fakülte/treaty kapasitesi için paralel teyit verir.
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
//        ESKALASYON ROTASI — bölge sahibinden yetkiliye somut yol
// Bölge sahibi yetkisini aşan bir iş gelince: hazırlar → devreder →
// mentor Lider UW → Kıdemli Müdür → GMY (gereken kademeye kadar); Reasürans paralel teyit.
// İştah dışı ise → Teknik Komite / red.
// ════════════════════════════════════════════════════════════════════
const OFFER_REGION: Record<string, string> = {
  KTT26011115: "ankara",      // Feslegen — Ankara/Kahramankazan
  KTT26016457: "anadolu1",    // Galva Metal — Tuzla
  KTT26018102: "akdeniz",     // Çukurova Tekstil — Adana
  KTT26019441: "mbm-obk-kdz", // Karakaya Plastik — düşük riskli bölge (Yrd. UW)
  KTT26020113: "akdeniz",     // Akdeniz Mobilya
  KTT26021004: "anadolu1",    // Tuzla Kimya
  KTT26022871: "ege",         // Ege Otel
  KTT26023115: "marmara",     // Kocaeli Demir-Çelik
  KTT26024009: "marmara",     // Bursa Otomotiv
  KTT26025117: "avrupa2",     // Trakya Un — Çerkezköy/Trakya
  KTT26025884: "ankara",      // Ankara AVM
  KTT26026223: "gab",         // Gaziantep Halı (İŞTAH DIŞI → komite)
  KTT26027001: "akdeniz",     // İskenderun Liman — Hatay (DİKKATLİ → mentor Lider'e devir)
  KTT26028115: "anadolu2",    // Kayseri Şeker
  KTT26029015: "anadolu2",    // Konya Tarım Mak.
  KTT26030441: "akdeniz",     // Mersin Petrokimya
};

// Sahibi Lider olmayan bölgelerde devir alacak mentor/yedek Lider UW
// (Kıdemli UW / UW / Yrd. UW bölgeleri en yakın Lider UW'ye devreder)
const REGION_MENTOR: Record<string, string> = {
  gab: "Veysel Aydın",          // GAB (K.UW) → Anadolu 2 Lideri
  akdeniz: "Emine Moroğlu Yazıcı",     // Akdeniz (K.UW) → Ege Lideri
  avrupa2: "Melek Çatalyürek",    // Avrupa 2 (K.UW) → Avrupa 1 Lideri (komşu)
  banka: "Turan Gökdemir",      // Banka (K.UW) → Ankara Lideri
  marmara: "Veysel Aydın",      // Marmara (UW) → Anadolu 2 Lideri
  anadolu1: "Turan Gökdemir",   // Anadolu 1 (UW) → Ankara Lideri
  "mbm-obk-kdz": "Emine Moroğlu Yazıcı", // MBM/OBK/KDZ (Yrd. UW) → Ege Lideri
};

// ── Gerçek limit bazlı yetki çözümleyici ──────────────────────────
// Bir teklifin Yangın bedeli + tarife sınıfına göre, kişinin gerçek
// 2026 yetki limitiyle tek başına bağlayıp bağlayamayacağını döner.
// Yetmezse zincirde limiti yeten ilk mercii bulur (Lider → K.Müdür → CUO).
function authForAmount(authKey: string, tarife: number, amount: number): boolean {
  const a = AUTH[authKey];
  if (!a) return false;
  const idx = Math.min(Math.max(tarife, 1), 6) - 1;
  return amount <= a.fireLimits[idx];
}

// Zincir sırası: bölge sahibi → (mentor Lider) → Kıdemli Müdür → CUO
// CUO = en üst, sistemin tanımlı son mercii (Uğur Özer)
const CHAIN_AUTH_ORDER = ["asistuw_l13", "asistuw_l10", "uw_l8", "uw_l7", "senioruw", "teamlead_l7", "teamlead", "manager"];

function resolveBindingAuthority(offer: Offer) {
  const region = REGIONS.find(r => r.id === OFFER_REGION[offer.ref]) || REGIONS[5];
  const owner = TEAM.find(t => t.regionId === region.id && t.lead) || TEAM[0];
  const amount = offer.sumInsured;
  const tarife = offer.tarife;
  const ownerCan = authForAmount(owner.authKey, tarife, amount);
  // Sahibi yetmezse: limiti yeten ilk üst profili bul
  let neededKey: string | null = null;
  if (!ownerCan) {
    for (const k of CHAIN_AUTH_ORDER) {
      if (AUTH[k].authLevel < AUTH[owner.authKey].authLevel && authForAmount(k, tarife, amount)) { neededKey = k; break; }
    }
    if (!neededKey) neededKey = "cuo"; // hiçbiri yetmezse CUO (sistem üstü)
  }
  return { region, owner, ownerCan, neededKey, amount, tarife };
}

function escalationPath(offer: Offer) {
  const region = REGIONS.find(r => r.id === OFFER_REGION[offer.ref]) || REGIONS[5];
  const owner = TEAM.find(t => t.regionId === region.id && t.lead) || TEAM[0];
  const ownerRole = ROLES.find(r => r.id === owner.roleId) || ROLES[0];
  const { req } = offerAuthority(offer);
  const lider = ROLES.find(r => r.id === "lideruw") || ROLES[3];
  const kmd = ROLES.find(r => r.id === "kidemlimudur") || ROLES[4];
  const gmy = ROLES.find(r => r.id === "gmy") || ROLES[7];
  const reas = ROLES.find(r => r.id === "reas") || ROLES[8];

  const hops: { name: string; role: Role | null }[] = [{ name: owner.name, role: ownerRole }];
  if (req === 99) {
    hops.push({ name: "Teknik Komite", role: null });
  } else if (ownerRole.level < req) {
    if (ownerRole.level < 4 && REGION_MENTOR[region.id]) hops.push({ name: REGION_MENTOR[region.id], role: lider });
    if (req >= 5) hops.push({ name: "Mustafa Arslan", role: kmd });
    if (req >= 6) hops.push({ name: "Endüstriyel Riskler GMY", role: gmy });
    if (req >= 7) hops.push({ name: "Reasürans Birimi", role: reas });
  }
  const bindingIdx = req === 99 ? -1 : hops.findIndex(h => h.role && h.role.level >= req);

  const steps = hops.map((h, i) => {
    let status = "DEVREDER", sc = T.amber;
    if (h.role === null) { status = "KOMİTE / RED"; sc = T.red; }
    else if (i === 0 && req === 99) { status = "HAZIRLAR → KOMİTE"; sc = T.red; }
    else if (i === 0 && i === bindingIdx) { status = "HAZIRLAR + ONAYLAR"; sc = T.green; }
    else if (i === 0) { status = "HAZIRLAR → DEVREDER"; sc = T.blue; }
    else if (i === bindingIdx) { status = (req >= 7 && h.role && h.role.id === "reas") ? "FAK. TEYİDİ" : "ONAYLAR · NİHAİ"; sc = T.green; }
    return { name: h.name, code: h.role ? h.role.code : "KOM", color: h.role ? h.role.color : T.red, status, sc };
  });
  return { region, owner, ownerRole, req, steps };
}

// ════════════════════════════════════════════════════════════════════
//                            APP ROUTER
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState<"dashboard" | "detail">("dashboard");
  const [selectedRef, setSelectedRef] = useState<string>(OFFERS[0].ref);
  const offer = OFFERS.find(o => o.ref === selectedRef) || OFFERS[0];

  if (view === "detail") {
    return <DetailView offer={offer} onBack={() => setView("dashboard")} />;
  }
  return <Dashboard onSelect={(ref) => { setSelectedRef(ref); setView("detail"); }} />;
}

// ════════════════════════════════════════════════════════════════════
//                            DASHBOARD
// ════════════════════════════════════════════════════════════════════
function Dashboard({ onSelect }: { onSelect: (ref: string) => void }) {
  const [tab, setTab] = useState<"havuz" | "atlas">("havuz");
  const [filterUW, setFilterUW] = useState<string>("Tümü");
  const [filterStatus, setFilterStatus] = useState<string>("Tümü");
  const [filterAppetite, setFilterAppetite] = useState<string>("Tümü");
  const [filterProfit, setFilterProfit] = useState<string>("Tümü");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");

  const uws = ["Tümü", ...Array.from(new Set(OFFERS.map(o => o.uw)))];
  const statuses = ["Tümü", "Hazırlanıyor", "Müdür Onayında", "GMY Onayında", "Reasürans Onayında", "Onaylandı", "Reddedildi"];

  const filtered = OFFERS.filter(o => {
    if (filterUW !== "Tümü" && o.uw !== filterUW) return false;
    if (filterStatus !== "Tümü" && o.status !== filterStatus) return false;
    if (filterAppetite !== "Tümü" && o.appetiteBand !== filterAppetite) return false;
    if (filterProfit !== "Tümü" && o.profitVerdict !== filterProfit) return false;
    if (search && !o.customer.toLowerCase().includes(search.toLowerCase()) && !o.ref.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "appetite") return b.appetiteScore - a.appetiteScore;
    if (sortBy === "risk") return b.riskScore - a.riskScore;
    if (sortBy === "profit") return b.profitMargin - a.profitMargin;
    if (sortBy === "premium") return b.grossPremium - a.grossPremium;
    if (sortBy === "sb") return b.sumInsured - a.sumInsured;
    return 0;
  });

  const kpi = {
    count: filtered.length,
    sumSI: filtered.reduce((s, o) => s + o.sumInsured, 0),
    sumPrem: filtered.reduce((s, o) => s + o.grossPremium, 0),
    avgAppetite: filtered.length ? filtered.reduce((s, o) => s + o.appetiteScore, 0) / filtered.length : 0,
    avgProfit: filtered.length ? filtered.reduce((s, o) => s + o.profitMargin, 0) / filtered.length : 0,
    pendingApproval: filtered.filter(o => o.status.includes("Onayında")).length,
    approved: filtered.filter(o => o.status === "Onaylandı").length,
    rejected: filtered.filter(o => o.status === "Reddedildi").length,
  };

  const zoneDist = Array.from({ length: 7 }, (_, i) => ({
    z: i + 1, count: filtered.filter(o => o.zone === i + 1).length,
  }));

  const flagCounts: Record<string, number> = {};
  filtered.forEach(o => o.flags.forEach(f => { flagCounts[f] = (flagCounts[f] || 0) + 1; }));
  const topFlags = Object.entries(flagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const profitBands = [
    { label: "ZARAR (<0)", min: -100, max: 0, color: T.red },
    { label: "DÜŞÜK (0-10)", min: 0, max: 10, color: T.amber },
    { label: "ORTA (10-15)", min: 10, max: 15, color: T.silver },
    { label: "İYİ (15-20)", min: 15, max: 20, color: T.green },
    { label: "MÜKEMMEL (20+)", min: 20, max: 100, color: T.green },
  ].map(b => ({ ...b, count: filtered.filter(o => o.profitMargin >= b.min && o.profitMargin < b.max).length }));

  return (
    <div className="sm-app" style={{ minHeight: "100vh", background: T.paper, fontFamily: T.body, color: T.ink }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />
      <GlobalStyle />

      {/* ════ MASTHEAD — Beyaz, ortada büyük SOMPO logosu, bordo başlık ════ */}
      <header style={{ background: T.white, borderBottom: `4px solid ${T.red}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px", display: "flex", alignItems: "center", gap: 24 }}>
          <SompoLogo size={56} />
          <div style={{ borderLeft: `2px solid ${T.rule}`, paddingLeft: 18, marginLeft: 4 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.red, letterSpacing: 2, fontWeight: 600 }}>SOMPO SİGORTA · ENDÜSTRİYEL RİSKLER · YANGIN TK</div>
            <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 500, marginTop: 3, letterSpacing: -0.5, color: T.ink }}>
              Karar Komiserliği — <em style={{ color: T.red, fontStyle: "italic", fontWeight: 600 }}>Teklif Havuzu</em>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ textAlign: "right", fontFamily: T.body, fontSize: 11 }}>
              <div style={{ color: T.silver, fontFamily: T.mono, fontSize: 9, letterSpacing: 1.5 }}>SİMÜLASYON DÖNEMİ</div>
              <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 13, color: T.red }}>UWY 2026 · MART HAFTA 4</div>
            </div>
            <div style={{ width: 1, height: 36, background: T.rule }} />
            <div style={{ textAlign: "right", fontFamily: T.body, fontSize: 11 }}>
              <div style={{ color: T.silver, fontFamily: T.mono, fontSize: 9, letterSpacing: 1.5 }}>YANGIN TK MÜDÜRÜ</div>
              <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 13, color: T.ink }}>Mustafa Arslan</div>
            </div>
          </div>
        </div>
      </header>

      {/* ════ SEKME NAVİGASYONU ════ */}
      <nav style={{ background: T.white, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px", display: "flex", gap: 0 }} role="tablist" aria-label="Ana görünüm">
          {[
            { id: "havuz", label: "Teklif Havuzu", sub: "BEKLEYEN İŞLER · YETKİ · EKİP", num: "I" },
            { id: "atlas", label: "Portföy Davranış Atlası", sub: "10 YIL · UW DAVRANIŞ HARİTASI", num: "II" },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} onClick={() => setTab(t.id as any)}
                className="sm-tab" style={{
                padding: "16px 20px", background: active ? T.silverBg : "transparent",
                border: "none", borderBottom: active ? `3px solid ${T.red}` : "3px solid transparent",
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: T.display, fontSize: 22, fontStyle: "italic", color: active ? T.red : T.silver, fontWeight: 400 }}>{t.num}</span>
                  <div>
                    <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500, color: active ? T.red : T.inkSoft, fontStyle: "italic" }}>{t.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>{t.sub}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {tab === "atlas" ? <PortfolioAtlas /> : <>

      <RoleBar />

      <RegionTeamMatrix />

      {/* ════ KPI STRIP ════ */}
      <section style={{ background: T.white, borderBottom: `1px solid ${T.rule}` }}>
        <div className="sm-kpi" style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 28px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 16 }}>
          {[
            { k: "TOPLAM TEKLİF", v: kpi.count, sub: `${OFFERS.length} havuzda`, color: T.red },
            { k: "TOPLAM SB", v: `${(kpi.sumSI / 1e9).toFixed(1)}B`, sub: "₺", color: T.red },
            { k: "TOPLAM BRÜT PRİM", v: `${(kpi.sumPrem / 1e6).toFixed(1)}M`, sub: "₺", color: T.red },
            { k: "ORT. İŞTAH", v: kpi.avgAppetite.toFixed(0), sub: "/100", color: kpi.avgAppetite > 60 ? T.green : kpi.avgAppetite > 45 ? T.amber : T.red },
            { k: "ORT. KARLILIK", v: `+%${kpi.avgProfit.toFixed(1)}`, sub: "net marj", color: kpi.avgProfit > 12 ? T.green : kpi.avgProfit > 6 ? T.amber : T.red },
            { k: "ONAYDA", v: kpi.pendingApproval, sub: "bekliyor", color: T.amber },
            { k: "ONAYLANDI / RED", v: `${kpi.approved} / ${kpi.rejected}`, sub: "kapanmış", color: T.silver },
          ].map((c, i) => (
            <div key={i} style={{ borderTop: `3px solid ${c.color}`, paddingTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.5, fontWeight: 600 }}>{c.k}</div>
              <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: c.color, marginTop: 4, lineHeight: 1 }}>{c.v}</div>
              <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkMute, marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ FILTER BAR ════ */}
      <section style={{ background: T.silverBg, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "10px 28px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.5, fontWeight: 700 }}>FİLTRELE</span>
          <FilterChip label="UW" value={filterUW} options={uws} onChange={setFilterUW} />
          <FilterChip label="DURUM" value={filterStatus} options={statuses} onChange={setFilterStatus} />
          <FilterChip label="İŞTAH" value={filterAppetite} options={["Tümü", "İŞTAH DAHİLİNDE", "ŞARTLI", "DİKKATLİ", "İŞTAH DIŞI"]} onChange={setFilterAppetite} />
          <FilterChip label="KARLILIK" value={filterProfit} options={["Tümü", "KARLI", "SINIRDA", "REVİZE", "ZARAR"]} onChange={setFilterProfit} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Müşteri / referans ara..." style={{
            fontFamily: T.body, fontSize: 12, padding: "6px 10px",
            border: `1px solid ${T.rule}`, background: T.white, outline: "none", minWidth: 220, color: T.ink,
          }} />
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>SIRALA</span>
          <FilterChip label="" value={sortBy} options={["date", "appetite", "risk", "profit", "premium", "sb"]} onChange={setSortBy} />
        </div>
      </section>

      {/* ════ MAIN GRID ════ */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <div style={{ background: T.white, border: `1px solid ${T.rule}` }}>
          <div style={{ background: T.red, color: T.white, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 2, color: T.onBrand }}>HAVUZ</div>
              <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, fontStyle: "italic" }}>Bekleyen Teklifler — {filtered.length} kayıt</div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.onBrand, letterSpacing: 1 }}>SATIRA TIKLA → DETAY</div>
          </div>
          <div className="sm-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11.5, minWidth: 900 }}>
            <thead>
              <tr style={{ background: T.silverBg, borderBottom: `2px solid ${T.red}` }}>
                {["REF / TARİH", "MÜŞTERİ / FAALİYET", "B/T", "SB / FİYAT", "İŞTAH", "RİSK", "KARLILIK", "DURUM / UW", "BAYRAK"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "9px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => <OfferRow key={o.ref} offer={o} onClick={() => onSelect(o.ref)} />)}
            </tbody>
          </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", fontFamily: T.body, color: T.inkMute }}>Filtreyle eşleşen teklif yok.</div>
          )}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Widget title="Portföy Risk Matrisi" sub="Tüm tekliflerin pozisyonu">
            <PortfolioMatrix offers={filtered} onSelect={onSelect} />
          </Widget>
          <Widget title="Bölge Dağılımı" sub="Deprem bölgesi kırılımı">
            {zoneDist.map(z => {
              const max = Math.max(...zoneDist.map(zz => zz.count), 1);
              const color = z.z <= 2 ? T.red : z.z <= 4 ? T.amber : T.green;
              return (
                <div key={z.z} style={{ display: "grid", gridTemplateColumns: "30px 1fr 28px", gap: 8, alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 600, color: T.red }}>B{z.z}</span>
                  <div style={{ background: T.silverBg, height: 12, position: "relative" }}>
                    <div style={{ background: color, height: "100%", width: `${(z.count / max) * 100}%` }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkSoft, textAlign: "right" }}>{z.count}</span>
                </div>
              );
            })}
          </Widget>
          <Widget title="Karlılık Dağılımı" sub="Net marj bantları">
            {profitBands.map((b, i) => {
              const max = Math.max(...profitBands.map(bb => bb.count), 1);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", gap: 8, alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, color: T.inkSoft, letterSpacing: 0.4 }}>{b.label}</span>
                  <div style={{ background: T.silverBg, height: 12, position: "relative" }}>
                    <div style={{ background: b.color, height: "100%", width: `${(b.count / max) * 100}%` }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkSoft, textAlign: "right" }}>{b.count}</span>
                </div>
              );
            })}
          </Widget>
          <Widget title="Bekleyen Aksiyonlar" sub="Portföy genelinde">
            {topFlags.length === 0 ? (
              <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic" }}>Aktif bayrak yok.</div>
            ) : topFlags.map(([flag, count]) => (
              <div key={flag} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 10px", marginBottom: 4,
                background: T.amberSoft, borderLeft: `3px solid ${T.amber}`,
              }}>
                <span style={{ fontFamily: T.body, fontSize: 11, color: T.amber, fontWeight: 600 }}>{flag}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.amber, padding: "1px 8px", background: T.white }}>{count}</span>
              </div>
            ))}
          </Widget>
        </aside>
      </main>
      </>}

      <footer style={{ borderTop: `1px solid ${T.rule}`, padding: "20px 28px", marginTop: 24, background: T.white }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>
          <span>UW ASİSTANI · KARAR KOMİSERLİĞİ · v14.0 · SOMPO KURUMSAL KİMLİK</span>
          <span>SOMPO SİGORTA · YANGIN TK MÜDÜRLÜĞÜ · 2026</span>
        </div>
      </footer>
    </div>
  );
}

function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.body, fontSize: 11 }}>
      {label && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 0.8 }}>{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        fontFamily: T.body, fontSize: 11, padding: "5px 8px",
        border: `1px solid ${T.rule}`, background: T.white, color: T.ink,
        outline: "none", cursor: "pointer",
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Widget({ title, sub, children }: { title: string; sub?: string; children?: any }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.rule}` }}>
      <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${T.ruleSoft}`, background: T.silverBg }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 2, fontWeight: 600 }}>WIDGET</div>
        <div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500, color: T.red, marginTop: 1, fontStyle: "italic" }}>{title}</div>
        {sub && <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function OfferRow({ offer, onClick }: { offer: Offer; onClick: () => void; key?: any }) {
  const statusColor: Record<string, string> = {
    "Hazırlanıyor": T.silver,
    "Müdür Onayında": T.amber,
    "GMY Onayında": T.amber,
    "Reasürans Onayında": T.blue,
    "Onaylandı": T.green,
    "Reddedildi": T.red,
  };
  const apBandColor = offer.appetiteBand === "İŞTAH DAHİLİNDE" ? T.green : offer.appetiteBand === "ŞARTLI" ? T.amber : offer.appetiteBand === "DİKKATLİ" ? T.amber : T.red;
  const profitColor = offer.profitVerdict === "KARLI" ? T.green : offer.profitVerdict === "SINIRDA" ? T.amber : offer.profitVerdict === "REVİZE" ? T.amber : T.red;
  const profitBg = offer.profitVerdict === "KARLI" ? T.greenSoft : offer.profitVerdict === "ZARAR" ? T.redSoft : T.amberSoft;

  return (
    <tr onClick={onClick}
      tabIndex={0} role="link"
      aria-label={`${offer.customer} — ${offer.ref} · teklif detayına git`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{ borderBottom: `1px solid ${T.ruleSoft}`, cursor: "pointer" }}>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.red }}>{offer.ref.slice(-6)}</div>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver }}>{offer.date}</div>
      </td>
      <td style={{ padding: "10px 10px", maxWidth: 260 }}>
        <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>{offer.customer}</div>
        <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 2 }}>{offer.activity}</div>
      </td>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "1px 5px", background: T.red, color: T.white, alignSelf: "start", letterSpacing: 0.3 }}>B{offer.zone}</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "1px 5px", background: T.silverBg, color: T.red, alignSelf: "start", letterSpacing: 0.3 }}>T{offer.tarife}</span>
        </div>
      </td>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 600, color: T.ink }}>{(offer.sumInsured / 1e6).toFixed(0)}m ₺</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkSoft }}>{offer.pricePpm.toFixed(2)}‰</span>
          <span style={{ fontFamily: T.mono, fontSize: 9, color: Math.abs(offer.benchmarkDelta) < 5 ? T.green : Math.abs(offer.benchmarkDelta) < 15 ? T.amber : T.red }}>
            {offer.benchmarkDelta >= 0 ? "▲" : "▼"}{Math.abs(offer.benchmarkDelta).toFixed(1)}%
          </span>
        </div>
      </td>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: apBandColor }}>{offer.appetiteScore}</span>
          <div style={{ width: 36, height: 4, background: T.silverBg, position: "relative" }}>
            <div style={{ background: apBandColor, height: "100%", width: `${offer.appetiteScore}%` }} />
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 8, color: apBandColor, marginTop: 2, letterSpacing: 0.3 }}>{offer.appetiteBand}</div>
      </td>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: T.blue }}>{offer.riskScore}</span>
          <div style={{ width: 36, height: 4, background: T.silverBg, position: "relative" }}>
            <div style={{ background: T.blue, height: "100%", width: `${offer.riskScore}%` }} />
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 8, color: T.blue, marginTop: 2, letterSpacing: 0.3 }}>{offer.riskBand}</div>
      </td>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: profitColor }}>
          {offer.profitMargin >= 0 ? "+" : ""}{offer.profitMargin.toFixed(1)}%
        </div>
        <span style={{
          fontFamily: T.mono, fontSize: 8, fontWeight: 700, padding: "1px 5px",
          background: profitBg, color: profitColor, letterSpacing: 0.5, display: "inline-block", marginTop: 2,
        }}>{offer.profitVerdict}</span>
      </td>
      <td style={{ padding: "10px 10px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[offer.status] || T.silver }} />
          <span style={{ fontFamily: T.body, fontSize: 10.5, color: statusColor[offer.status] || T.silver, fontWeight: 600 }}>{offer.status}</span>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, marginTop: 2 }}>{offer.uw}</div>
      </td>
      <td style={{ padding: "10px 10px" }}>
        {offer.flags.length === 0 ? (
          <span style={{ color: T.green, fontFamily: T.mono, fontSize: 12 }}>✓</span>
        ) : (
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }} title={offer.flags.join(", ")}>
            {offer.flags.slice(0, 3).map((_, i) => (
              <span key={i} style={{ width: 7, height: 7, background: T.amber, borderRadius: "50%" }} />
            ))}
            {offer.flags.length > 3 && <span style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, fontWeight: 700 }}>+{offer.flags.length - 3}</span>}
          </div>
        )}
      </td>
    </tr>
  );
}

function PortfolioMatrix({ offers, onSelect }: { offers: Offer[]; onSelect: (ref: string) => void }) {
  const cells = [
    [{ key: "TL", label: "Hedef İş", color: T.green, bg: T.greenSoft }, { key: "TR", label: "Hedef Değil", color: T.red, bg: T.redTint }],
    [{ key: "BL", label: "Hedef İş", color: T.green, bg: T.greenSoft }, { key: "BR", label: "Fiyatla Hedef", color: T.amber, bg: T.amberSoft }],
  ];
  const byPos: Record<MatrixPos, Offer[]> = { TL: [], TR: [], BL: [], BR: [] };
  offers.forEach(o => byPos[o.matrixPos].push(o));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: T.mono, fontSize: 8, color: T.silver, letterSpacing: 1, padding: "0 6px 0 0", display: "flex", alignItems: "center" }}>
          RİSK KALİTESİ →
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 240, border: `1px solid ${T.red}` }}>
            {cells.flatMap((row, ri) => row.map((c, ci) => {
              const inCell = byPos[c.key as MatrixPos];
              return (
                <div key={c.key} style={{
                  background: c.bg, padding: 6, position: "relative",
                  borderRight: ci === 0 ? `1px solid ${T.rule}` : "none",
                  borderBottom: ri === 0 ? `1px solid ${T.rule}` : "none",
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: 8, color: c.color, letterSpacing: 0.5, fontWeight: 700 }}>{c.key} · {c.label}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: c.color, marginTop: 2 }}>{inCell.length} teklif</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 6 }}>
                    {inCell.map(o => (
                      <button key={o.ref} type="button"
                        title={`${o.customer} · İştah ${o.appetiteScore} · Risk ${o.riskScore}`}
                        aria-label={`${o.customer} · İştah ${o.appetiteScore} · Risk ${o.riskScore}`}
                        onClick={() => onSelect(o.ref)}
                        style={{
                          width: 12, height: 12, padding: 0, borderRadius: "50%", background: c.color,
                          border: "1.5px solid #fff", cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        }} />
                    ))}
                  </div>
                </div>
              );
            }))}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 8, color: T.silver, letterSpacing: 1, textAlign: "center", padding: "4px 0 0" }}>
            FREKANS LOSS RATIO →
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontFamily: T.body, fontSize: 10, color: T.inkMute, fontStyle: "italic" }}>
        Bir noktaya tıkla → o teklifin detayına git
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//             PORTFÖY DAVRANIŞ ATLASI — 10 yıl gerçek UW davranışı
// ════════════════════════════════════════════════════════════════════
function PortfolioAtlas() {
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [selectedFK, setSelectedFK] = useState<number | null>(null);

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px" }}>
      {/* Hero / Master KPI'ler */}
      <div style={{ background: T.white, border: `1px solid ${T.rule}`, padding: "20px 24px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <span style={{ width: 26, height: 26, border: `1.5px solid ${T.red}`, fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.red, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>α</span>
          <h2 style={{ margin: 0, fontFamily: T.display, fontSize: 26, fontStyle: "italic", color: T.red, fontWeight: 500, letterSpacing: -0.4 }}>10 yıllık portföy davranışı</h2>
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10, color: T.silver, letterSpacing: 1 }}>112 BİLEŞİK ÜRÜN · 2016-2025 · UWY 10y</span>
        </div>
        <div className="sm-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          {[
            { k: "POLİÇE SAYISI", v: MASTER.meta.totalPolicies.toLocaleString("tr-TR"), sub: "10 yıl toplam", color: T.red },
            { k: "TOPLAM PRİM", v: `${(MASTER.meta.totalPremium / 1e6).toFixed(1)}M €`, sub: "Brüt", color: T.red },
            { k: "TOPLAM HASAR", v: `${(MASTER.meta.totalLoss / 1e6).toFixed(1)}M €`, sub: `H/P %${MASTER.meta.overallHP.toFixed(1)}`, color: T.amber },
            { k: "10y NET SONUÇ", v: `${(MASTER.meta.overallNetResult / 1e6).toFixed(1)}M €`, sub: "Mevcut parametrelerle", color: T.red },
            { k: "FAALİYET KOLU", v: `${MASTER.meta.selectedFK} / ${MASTER.meta.totalFK}`, sub: "Seçili / Toplam", color: T.silver },
            { k: "SEÇİLİ HP", v: `%${MASTER.meta.selectedHP}`, sub: `Prim payı %${MASTER.meta.selectedPremShare}`, color: T.green },
          ].map((c, i) => (
            <div key={i} style={{ borderTop: `3px solid ${c.color}`, paddingTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.5, fontWeight: 600 }}>{c.k}</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: c.color, marginTop: 4, lineHeight: 1 }}>{c.v}</div>
              <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkMute, marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bölge Bazlı Davranış */}
      <Block idx="A" title="Deprem Bölgesi UW Davranışı" sub="Break-even × gerçekleşen HPO · 10 yıllık seçili portföy">
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>HPO ŞELALESİ — BREAK-EVEN VS GERÇEKLEŞEN</div>
            {MASTER.bolge.map(b => {
              const isLoss = b.sapma > 0;
              const isMarginal = Math.abs(b.sapma) < 5;
              const c = isMarginal ? T.amber : isLoss ? T.red : T.green;      // metin (AA)
              const barC = isMarginal ? T.amberFill : isLoss ? T.red : T.greenFill; // çubuk dolgusu
              return (
                <div key={b.z} onClick={() => setSelectedZone(selectedZone === b.z ? null : b.z)}
                  style={{
                    display: "grid", gridTemplateColumns: "70px 1fr 80px", gap: 12, alignItems: "center",
                    padding: "10px 8px", marginBottom: 4, cursor: "pointer",
                    background: selectedZone === b.z ? T.silverBg : "transparent",
                    borderLeft: `3px solid ${c}`,
                  }}>
                  <div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.red }}>B{b.z}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 0.5 }}>CAT %{b.cat}</div>
                  </div>
                  <div>
                    {/* Gauge bar */}
                    <div style={{ position: "relative", height: 22, background: T.silverBg }}>
                      {/* Break-even threshold marker */}
                      <div style={{ position: "absolute", left: `${b.breakeven}%`, top: -4, bottom: -4, borderLeft: `2px dashed ${T.silverDeep}` }} />
                      <div style={{ position: "absolute", left: `${b.breakeven}%`, top: -16, fontFamily: T.mono, fontSize: 8, color: T.silverDeep, transform: "translateX(-50%)" }}>BE %{b.breakeven}</div>
                      {/* Actual HPO bar */}
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${b.hp}%`, background: barC }} />
                      {/* Actual HPO label */}
                      <div style={{ position: "absolute", left: `${b.hp}%`, top: "50%", transform: "translateY(-50%) translateX(6px)", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: c }}>
                        %{b.hp.toFixed(1)}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: T.mono, fontSize: 9, color: T.silver }}>
                      <span>{b.label}</span>
                      <span>{b.police.toLocaleString("tr-TR")} poliçe · {(b.prim / 1e6).toFixed(1)}M € prim</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: c }}>
                      {b.sapma >= 0 ? "+" : ""}{b.sapma.toFixed(1)}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 8, color: c, letterSpacing: 0.5, fontWeight: 600 }}>{b.durum}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>SEÇİLİ BÖLGE DETAY</div>
            {selectedZone ? (() => {
              const b = MASTER.bolge.find(x => x.z === selectedZone)!;
              const isLoss = b.sapma > 0;
              const c = Math.abs(b.sapma) < 5 ? T.amber : isLoss ? T.red : T.green;
              return (
                <div style={{ background: T.silverBg, padding: 16, borderLeft: `4px solid ${c}` }}>
                  <div style={{ fontFamily: T.display, fontSize: 22, fontStyle: "italic", color: c, fontWeight: 500 }}>Bölge {b.z}</div>
                  <div style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{b.label}</div>

                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>BREAK-EVEN HPO</div><div style={{ fontFamily: T.mono, fontSize: 18, color: T.silverDeep, fontWeight: 700 }}>%{b.breakeven}</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>GERÇEKLEŞEN</div><div style={{ fontFamily: T.mono, fontSize: 18, color: c, fontWeight: 700 }}>%{b.hp.toFixed(1)}</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>HEDEF HPO</div><div style={{ fontFamily: T.mono, fontSize: 18, color: T.green, fontWeight: 700 }}>%{b.hedef}</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>DEPREM PAYI</div><div style={{ fontFamily: T.mono, fontSize: 18, color: b.depremPay > 75 ? T.amber : T.ink, fontWeight: 700 }}>%{b.depremPay.toFixed(1)}</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>POLİÇE</div><div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>{b.police.toLocaleString("tr-TR")}</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>10y BRÜT PRİM</div><div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>{(b.prim / 1e6).toFixed(1)}M €</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>HACİM PAYI</div><div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>%{b.hacimPayi.toFixed(1)}</div></div>
                    <div><div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>MAX KOMİSYON</div><div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>%{b.komisyonMax}</div></div>
                  </div>

                  <div style={{ marginTop: 14, padding: "10px 12px", background: T.white, borderLeft: `3px solid ${c}` }}>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: c, letterSpacing: 1, fontWeight: 700 }}>UW DAVRANIŞ ÖNERİSİ</div>
                    <div style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{b.note}</div>
                  </div>
                </div>
              );
            })() : (
              <div style={{ background: T.silverBg, padding: 24, textAlign: "center", color: T.silver, fontFamily: T.body, fontSize: 12, fontStyle: "italic" }}>
                Sol panelden bir bölgeye tıkla → 10 yıllık davranış detayı
              </div>
            )}

            <div style={{ marginTop: 14, padding: 12, background: T.amberSoft, borderLeft: `3px solid ${T.amber}` }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, letterSpacing: 1, fontWeight: 700 }}>FORMÜL</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
                Break-even = 100 − Acente Kom (%{MASTER.parametre.acenteKom}) − GG (%{MASTER.parametre.gg}) − CAT (bölgeye göre) − Hedef Kar (%{MASTER.parametre.hedefKar})
              </div>
              <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkMute, marginTop: 4, fontStyle: "italic" }}>
                B1-2: %40 · B3-5: %45 · B6-7: %50
              </div>
            </div>
          </div>
        </div>
      </Block>

      {/* HPO Segmenti Piramidi */}
      <Block idx="B" title="HPO Segment Piramidi" sub="5 segmentli portföy yapısı · A (Karlı) → E (Tam Cede)">
        <div className="sm-grid5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {MASTER.segment.map(s => {
            const colorMap: Record<string, string> = { green: T.green, amber: T.amber, red: T.red };
            const c = colorMap[s.color];
            const bg = s.color === "green" ? T.greenSoft : s.color === "amber" ? T.amberSoft : T.redTint;
            return (
              <div key={s.id} style={{ background: bg, borderTop: `3px solid ${c}`, padding: "14px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: T.display, fontSize: 28, fontStyle: "italic", color: c, fontWeight: 500 }}>{s.id}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: c, fontWeight: 700 }}>{s.range}</span>
                </div>
                <div style={{ fontFamily: T.body, fontSize: 11.5, color: c, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                <div style={{ marginTop: 10, fontFamily: T.body, fontSize: 11, color: T.inkSoft, lineHeight: 1.5 }}>
                  <div><span style={{ color: T.silver }}>FK</span> · <strong>{s.fkSayi}</strong> ({s.secili} seçili)</div>
                  <div><span style={{ color: T.silver }}>Poliçe</span> · <strong>{s.police.toLocaleString("tr-TR")}</strong></div>
                  <div><span style={{ color: T.silver }}>Prim</span> · <strong>{(s.prim / 1e6).toFixed(1)}M €</strong> ({s.primPay.toFixed(1)}%)</div>
                  <div><span style={{ color: T.silver }}>Segment HPO</span> · <strong style={{ color: c }}>%{s.hp.toFixed(1)}</strong></div>
                </div>
                <div style={{ marginTop: 10, padding: "6px 8px", background: T.white, borderLeft: `3px solid ${c}` }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: c, letterSpacing: 0.8, fontWeight: 700 }}>{s.karar}</div>
                  <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkSoft, marginTop: 2 }}>{s.aksiyon}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Block>

      {/* FK × Bölge Isı Haritası */}
      <Block idx="C" title="FK × Bölge HPO Isı Haritası" sub="Top 15 seçili FK · 7 deprem bölgesi · gerçek 10y HPO">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.red}` }}>
                <th style={{ textAlign: "left", padding: "8px 8px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1, fontWeight: 700, width: 60 }}>FK KOD</th>
                <th style={{ textAlign: "left", padding: "8px 8px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1, fontWeight: 700 }}>FAALİYET</th>
                <th style={{ textAlign: "right", padding: "8px 8px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1, fontWeight: 700 }}>10y HPO</th>
                {[1,2,3,4,5,6,7].map(b => (
                  <th key={b} style={{ textAlign: "center", padding: "8px 4px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 0.5, fontWeight: 700, minWidth: 56 }}>B{b}</th>
                ))}
                <th style={{ textAlign: "center", padding: "8px 4px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 0.5, fontWeight: 700, width: 80 }}>SEGMENT</th>
              </tr>
            </thead>
            <tbody>
              {MASTER.topFK.map(fk => {
                const row = MASTER.fkBolgeHPO[fk.kod] || [];
                const segMap: Record<string, string> = { A: T.green, B: T.green, C: T.amber, D: T.amber, E: T.red };
                const segColor = segMap[fk.segment];
                return (
                  <tr key={fk.kod} onClick={() => setSelectedFK(selectedFK === fk.kod ? null : fk.kod)}
                    style={{ borderBottom: `1px solid ${T.ruleSoft}`, cursor: "pointer", background: selectedFK === fk.kod ? T.silverBg : "transparent" }}>
                    <td style={{ padding: "8px 8px", fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: T.red, fontStyle: "italic" }}>{fk.kod}</td>
                    <td style={{ padding: "8px 8px", fontSize: 11, color: T.ink, lineHeight: 1.3 }}>{fk.ad}</td>
                    <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: fk.hp > 100 ? T.red : fk.hp > 65 ? T.amber : fk.hp > 50 ? T.amber : T.green }}>
                      %{fk.hp.toFixed(1)}
                    </td>
                    {row.map((v, i) => {
                      if (v === null) return <td key={i} style={{ padding: "4px 4px", textAlign: "center", color: T.silver, fontFamily: T.mono, fontSize: 10, background: "repeating-linear-gradient(45deg, #fff, #fff 2px, #f5f5f5 2px, #f5f5f5 4px)" }}>—</td>;
                      let bg = T.greenSoft;
                      let fg = T.green;
                      if (v >= 100) { bg = T.redTint; fg = T.red; }
                      else if (v >= 65) { bg = T.amberMid; fg = T.amber; }
                      else if (v >= 50) { bg = T.amberSoft; fg = T.amber; }
                      else if (v >= 45) { bg = T.oliveSoft; fg = T.green; }
                      return (
                        <td key={i} style={{ padding: "6px 4px", textAlign: "center", background: bg, fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: fg }}>
                          {v.toFixed(0)}
                        </td>
                      );
                    })}
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "3px 8px", background: segColor, color: T.white, letterSpacing: 0.8 }}>{fk.segment}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 0.5, alignItems: "center", flexWrap: "wrap" }}>
          <span>HPO RENK ÖLÇEĞİ:</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 18, height: 12, background: T.greenSoft, border: `1px solid ${T.green}` }}/>&lt;%45 KARLI</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 18, height: 12, background: T.oliveSoft, border: `1px solid ${T.green}` }}/>%45-50 MARJİNAL</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 18, height: 12, background: T.amberSoft, border: `1px solid ${T.amber}` }}/>%50-65 ZARAR</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 18, height: 12, background: T.amberMid, border: `1px solid ${T.amber}` }}/>%65-100 CEDE</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 18, height: 12, background: T.redTint, border: `1px solid ${T.red}` }}/>&gt;%100 RED</span>
        </div>
      </Block>

      {/* Karar Matrisi - Etkileşimli simülatör */}
      <Block idx="D" title="UW Karar Matrisi — Canlı Simülatör" sub="HPO × Bölge × Bedel kombinasyon kararı">
        <KararMatrisiSimulator />
      </Block>

      {/* Top Bulgular */}
      <Block idx="E" title="10 Yıllık Top Bulgular" sub="Master analiz · UW karar destek hipotezleri">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {MASTER.bulgular.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px", background: T.silverBg, borderLeft: `3px solid ${T.red}` }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.red, fontStyle: "italic" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>
      </Block>
    </main>
  );
}

// ─── Karar Matrisi Etkileşimli Simülatör ─────────────────────────────
function KararMatrisiSimulator() {
  const [hp, setHp] = useState(45);
  const [bolge, setBolge] = useState(1);
  const [bedel, setBedel] = useState(50);

  const k = MASTER.karar(hp, bolge, bedel);
  const cat = bolge <= 2 ? 20 : bolge <= 5 ? 15 : 10;
  const breakeven = 100 - 25 - 10 - cat - 5;
  const colorMap: Record<string, string> = { green: T.green, amber: T.amber, red: T.red };
  const c = colorMap[k.renk];
  const overCap = bedel > 8.5;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>SİMÜLASYON GİRDİLERİ</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft }}>Beklenen HPO (%)</span>
            <span style={{ fontFamily: T.mono, fontSize: 14, color: T.red, fontWeight: 700 }}>%{hp}</span>
          </div>
          <input type="range" min="0" max="200" step="1" value={hp} onChange={(e) => setHp(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.silver, marginTop: 2 }}>
            <span>%0</span><span>%50</span><span>%100</span><span>%200</span>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 6, fontFamily: T.body, fontSize: 12, color: T.inkSoft }}>Deprem Bölgesi</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {[1,2,3,4,5,6,7].map(b => (
              <button key={b} onClick={() => setBolge(b)} style={{
                padding: "10px 6px", background: bolge === b ? T.red : T.white,
                color: bolge === b ? T.white : T.inkSoft,
                border: `1px solid ${bolge === b ? T.red : T.rule}`,
                fontFamily: T.mono, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>B{b}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft }}>Sigorta Bedeli (M €)</span>
            <span style={{ fontFamily: T.mono, fontSize: 14, color: T.red, fontWeight: 700 }}>{bedel} M €</span>
          </div>
          <input type="range" min="0.5" max="100" step="0.5" value={bedel} onChange={(e) => setBedel(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.silver, marginTop: 2 }}>
            <span>0.5M</span><span>8.5M (cap)</span><span>50M</span><span>100M</span>
          </div>
        </div>

        <div style={{ background: T.silverBg, padding: 12, marginTop: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>HESAPLAMA</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, lineHeight: 1.7 }}>
            CAT (Bölge {bolge}): <strong>%{cat}</strong><br />
            Break-even HPO: 100 − 25 − 10 − {cat} − 5 = <strong style={{ color: T.red }}>%{breakeven}</strong><br />
            Sapma: <strong style={{ color: c }}>{hp - breakeven >= 0 ? "+" : ""}{(hp - breakeven).toFixed(1)} puan</strong><br />
            {overCap && <span style={{ color: T.amber, fontWeight: 700 }}>⚠ 8.5M cap aşımı — surplus cede zorunlu</span>}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>UW KARARI</div>

        <div style={{ background: c, color: T.white, padding: "20px 22px", marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.onBrand, letterSpacing: 2, fontWeight: 600 }}>SİSTEM ÖNERİSİ</div>
          <div style={{ fontFamily: T.display, fontSize: 32, fontStyle: "italic", marginTop: 6, lineHeight: 1.1, fontWeight: 500, letterSpacing: -0.5 }}>
            {k.tip}
          </div>
          <div style={{ fontFamily: T.body, fontSize: 12, color: T.onBrand, marginTop: 8, lineHeight: 1.5 }}>
            {k.aksiyon}
          </div>
        </div>

        {/* Davranış kuralları (referans tablosu) */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>KARAR EŞİKLERİ</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.red}` }}>
              <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 700 }}>HPO BANDI</th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 700 }}>KARAR</th>
              <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 700 }}>AKSİYON</th>
            </tr>
          </thead>
          <tbody>
            {[
              { r: `< %${breakeven - 5}`, k: "HEDEF İŞ", c: T.green, a: "Komisyon esnek, kapasite ayır" },
              { r: `%${breakeven - 5} - %${breakeven}`, k: "MARJİNAL KAR", c: T.green, a: "Standart fiyat, koşullar net olsun" },
              { r: `%${breakeven} - %${breakeven + 10}`, k: "ŞARTLI KABUL", c: T.amber, a: "Fiyat +5-10p, RT, dep. muafiyet %5" },
              { r: `%${breakeven + 10} - %65`, k: "AĞIR ŞARTLI", c: T.amber, a: "Fiyat artışı + bedel kıs, müdür onayı" },
              { r: `%65 - %100`, k: "CEDE", c: T.red, a: "Konservasyona alma, fakülteyle hareket" },
              { r: `> %100`, k: "RED", c: T.red, a: "Portföye girmemeli, 3x fiyat veya çıkar" },
            ].map((row, i) => {
              const active = k.tip === row.k;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}`, background: active ? T.silverBg : "transparent" }}>
                  <td style={{ padding: "6px 8px", fontFamily: T.mono, color: T.inkSoft }}>{row.r}</td>
                  <td style={{ padding: "6px 8px", fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: row.c }}>{row.k}</td>
                  <td style={{ padding: "6px 8px", color: T.inkMute, fontSize: 10.5 }}>{row.a}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 12, padding: 10, background: T.amberSoft, borderLeft: `3px solid ${T.amber}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, letterSpacing: 1, fontWeight: 700 }}>NOT</div>
          <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
            Eşikler bölgeye göre kayar — Bölge 6-7'de daha gevşek (%50 BE), Bölge 1-2'de daha sıkı (%40 BE). 8.5M cap üzerinde her durumda surplus cede zorunlu.
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//                     DETAIL VIEW — Masthead + 4 Stages
// ════════════════════════════════════════════════════════════════════
function DetailView({ offer, onBack }: { offer: Offer; onBack: () => void }) {
  const [stage, setStage] = useState("appetite");
  const stageIdx = STAGES.findIndex(s => s.id === stage);
  const isFeslegen = offer.ref === "KTT26011115";

  return (
    <div className="sm-app" style={{ minHeight: "100vh", background: T.paper, fontFamily: T.body, color: T.ink }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />
      <GlobalStyle />

      {/* ════ MASTHEAD — Bordo, beyaz logo kutusu, MASAK/İCAP/TAHSİLAT ════ */}
      <header style={{ background: T.red, color: T.white }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 18 }}>
          <button onClick={onBack} style={{
            fontFamily: T.mono, fontSize: 10, fontWeight: 600, letterSpacing: 1,
            padding: "8px 14px", background: "transparent", color: T.white,
            border: `1px solid ${T.white}`, cursor: "pointer", textTransform: "uppercase",
          }}>← Havuza Dön</button>
          <div style={{ background: T.white, padding: "6px 8px 4px", borderRadius: 2 }}>
            <SompoLogo size={36} />
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.onBrand, letterSpacing: 2 }}>SOMPO SİGORTA · ENDÜSTRİYEL RİSKLER</div>
            <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500, marginTop: 2, letterSpacing: -0.4, color: T.white }}>
              UW Asistanı <em style={{ color: T.onBrand, fontStyle: "italic" }}>Karar Matrisi</em>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
            {isFeslegen && (
              <div style={{ display: "flex", gap: 4 }}>
                {TEKLIF_FESLEGEN.topBadges.map(b => (
                  <span key={b.label} style={{
                    fontFamily: T.mono, fontSize: 10, fontWeight: 700, padding: "5px 10px",
                    background: b.color, color: T.white, letterSpacing: 1,
                  }}>{b.label}</span>
                ))}
              </div>
            )}
            <button style={{
              fontFamily: T.mono, fontSize: 10, fontWeight: 600, letterSpacing: 1,
              padding: "8px 14px", background: "transparent", color: T.white,
              border: `1px solid ${T.white}`, cursor: "pointer", textTransform: "uppercase",
            }}>○ OPERASYONEL</button>
            <div style={{ textAlign: "right", fontFamily: T.body, fontSize: 11 }}>
              <div style={{ color: T.onBrand, fontFamily: T.mono, fontSize: 9, letterSpacing: 1 }}>REFERANS</div>
              <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 13, color: T.white }}>{offer.ref}</div>
            </div>
          </div>
        </div>

        {/* Sub-bar — daha açık bordo, müşteri context */}
        <div style={{ background: T.redDeep, padding: "12px 28px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 18, fontSize: 11 }}>
            {[
              { k: "MÜŞTERİ", v: offer.customer, big: true },
              { k: "FAALİYET", v: offer.activity },
              { k: "NACE", v: offer.nace, mono: true },
              { k: "S. BEDELİ", v: `${(offer.sumInsured / 1e6).toFixed(0)} mio ₺`, mono: true },
              { k: "BRÜT PRİM", v: `${(offer.grossPremium / 1e3).toFixed(0)}k ₺`, mono: true },
              { k: "UW", v: offer.uw },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ color: T.silver, fontFamily: T.mono, fontSize: 8, letterSpacing: 1.5, marginBottom: 3, fontWeight: 600 }}>{c.k}</div>
                <div style={{
                  fontFamily: c.big ? T.display : (c.mono ? T.mono : T.body),
                  fontSize: c.big ? 14 : 12, fontWeight: c.big ? 600 : 500, color: T.white,
                  letterSpacing: c.big ? -0.2 : 0,
                }}>{c.v}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <RoleBar offer={offer} />

      {!isFeslegen && offer.ref !== "KTT26016457" && (
        <div style={{ background: T.amberPale, borderBottom: `1px solid ${T.amber}`, padding: "8px 28px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, fontFamily: T.body, fontSize: 11.5, color: T.amber }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "2px 8px", background: T.amber, color: T.white }}>PİLOT</span>
            <span>Detaylı analiz veri katmanı şu an pilot olarak <strong>FESLEĞEN</strong> ve <strong>GALVA METAL</strong> üzerinde dolu. KPI/skor değerleri bu teklifin gerçek havuz verisiyle hizalı; derin alt-bloklar (COPE, hesap kaskadı) pilot risklerden gösteriliyor.</span>
          </div>
        </div>
      )}

      {/* ════ STAGE NAVIGATOR ════ */}
      <nav style={{ background: T.white, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px", display: "flex" }}>
          {STAGES.map((s, i) => {
            const active = s.id === stage;
            const done = i < stageIdx;
            return (
              <button key={s.id} onClick={() => setStage(s.id)} style={{
                flex: 1, padding: "16px 12px", background: active ? T.silverBg : "transparent",
                border: "none", borderBottom: active ? `3px solid ${T.red}` : `3px solid transparent`,
                borderRight: i < STAGES.length - 1 ? `1px solid ${T.ruleSoft}` : "none",
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{
                    fontFamily: T.display, fontSize: 22, fontStyle: "italic",
                    color: active ? T.red : (done ? T.silver : T.inkMute), fontWeight: 400,
                  }}>{s.num}</span>
                  <div>
                    <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500, color: active ? T.red : T.inkSoft, fontStyle: "italic" }}>{s.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>{s.sub.toUpperCase()}</div>
                  </div>
                  {done && <span style={{ marginLeft: "auto", color: T.green, fontSize: 16 }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 28px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
        <div>
          {stage === "appetite" && <StageAppetite offer={offer} isFeslegen={isFeslegen} />}
          {stage === "quality" && <StageQuality offer={offer} isFeslegen={isFeslegen} />}
          {stage === "design" && <StageDesign offer={offer} isFeslegen={isFeslegen} />}
          {stage === "decision" && <StageDecision offer={offer} isFeslegen={isFeslegen} />}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, padding: "16px 0", borderTop: `1px solid ${T.rule}` }}>
            <button disabled={stageIdx === 0} onClick={() => setStage(STAGES[stageIdx - 1].id)} style={{
              fontFamily: T.body, fontSize: 12, padding: "10px 18px", background: "transparent",
              border: `1px solid ${stageIdx === 0 ? T.rule : T.red}`, color: stageIdx === 0 ? T.silver : T.red,
              cursor: stageIdx === 0 ? "not-allowed" : "pointer",
            }}>← Önceki Aşama</button>
            <button disabled={stageIdx === STAGES.length - 1} onClick={() => setStage(STAGES[stageIdx + 1].id)} style={{
              fontFamily: T.body, fontSize: 12, fontWeight: 600, padding: "10px 18px",
              background: stageIdx === STAGES.length - 1 ? T.silverBg : T.red,
              color: stageIdx === STAGES.length - 1 ? T.silver : T.white,
              border: "none", cursor: stageIdx === STAGES.length - 1 ? "not-allowed" : "pointer",
            }}>Sonraki Aşama →</button>
          </div>
        </div>

        <aside style={{ position: "sticky", top: 16, alignSelf: "flex-start" }}>
          <KararMatrisi offer={offer} stage={stage} />
        </aside>
      </main>

      <footer style={{ borderTop: `1px solid ${T.rule}`, padding: "20px 28px", marginTop: 24, background: T.white }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1 }}>
          <span>UW ASİSTANI · KARAR MATRİSİ · v14.0 · SOMPO KURUMSAL KİMLİK</span>
          <span>FESLEĞEN TOPLU YEMEK · KTT26011115 · 2026</span>
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//                    STAGE I — RİSK İŞTAHI
// ════════════════════════════════════════════════════════════════════
function StageAppetite({ offer, isFeslegen }: { offer: Offer; isFeslegen: boolean }) {
  return (
    <>
      {/* B. Trafik Işığı Sistemi */}
      <Block idx="B" title="Trafik Işığı Sistemi" sub="Algoritma çıktısı · 10 değişkenli WoE-skormetre · v2.4 · UWY 2024 örneklem · GINI 0.496">
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>ALGORİTMA ÇIKTISI</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ border: `1px solid ${T.rule}`, borderTop: `3px solid ${T.red}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>TOPLAM SKOR (LOGIT)</div>
            <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 600, color: T.green, marginTop: 6, lineHeight: 1 }}>−0.143</div>
            <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkMute, marginTop: 4 }}>Σ değişkenler (−0.113) + sabit (−0.030)</div>
          </div>
          <div style={{ border: `1px solid ${T.rule}`, borderTop: `3px solid ${T.amber}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>RİSK OLASILIĞI</div>
            <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 600, color: T.amber, marginTop: 6, lineHeight: 1 }}>%46.4</div>
            <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkMute, marginTop: 4 }}>σ(skor) = 1 / (1 + e<sup>-skor</sup>)</div>
          </div>
          <div style={{ border: `1px solid ${T.amber}`, padding: "14px 16px", background: T.amberSoft }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, letterSpacing: 1.2, fontWeight: 600 }}>NİHAİ KARAR · TRAFİK IŞIĞI</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", background: T.amberFill, display: "inline-block" }}></span>
              <span style={{ fontFamily: T.display, fontSize: 30, fontStyle: "italic", color: T.amber, fontWeight: 500 }}>SARI</span>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.amber, letterSpacing: 0.8, marginTop: 6, fontWeight: 600 }}>ŞARTLI · UW DEĞERLENDİRMESİ</div>
          </div>
        </div>

        {/* Karar eşiği bandı */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>KARAR EŞİĞİ ÜZERİNDE POZİSYON</div>
        <div style={{ position: "relative", height: 36, background: `linear-gradient(to right, ${T.greenSoft} 0%, ${T.greenSoft} 30%, ${T.amberSoft} 30%, ${T.amberSoft} 55%, ${T.redTint} 55%, ${T.redTint} 100%)`, marginBottom: 4 }}>
          {/* dashed dividers */}
          <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, borderLeft: `1px dashed ${T.green}` }} />
          <div style={{ position: "absolute", left: "55%", top: 0, bottom: 0, borderLeft: `1px dashed ${T.amber}` }} />
          {/* pointer at 46.4% */}
          <div style={{ position: "absolute", left: "46.4%", top: -22, transform: "translateX(-50%)" }}>
            <div style={{ background: T.red, color: T.white, padding: "2px 6px", fontFamily: T.mono, fontSize: 10, fontWeight: 700 }}>%46.4</div>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${T.red}`, marginLeft: "auto", marginRight: "auto" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 0.5 }}>
          <div><strong style={{ color: T.green }}>YEŞİL</strong> · %0–%30<br /><span style={{ color: T.silver }}>Otomatik kabul</span></div>
          <div style={{ textAlign: "center" }}><strong style={{ color: T.amber }}>SARI</strong> · %30–%55<br /><span style={{ color: T.silver }}>UW değerlendirme</span></div>
          <div style={{ textAlign: "right" }}><strong style={{ color: T.red }}>KIRMIZI</strong> · %55–100<br /><span style={{ color: T.silver }}>Yüksek otorizasyon / red</span></div>
        </div>

        {/* Değişken tablosu */}
        <div style={{ marginTop: 24, fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>DEĞİŞKEN KIRILIMI</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.rule}` }}>
              {["DEĞİŞKEN", "DEĞER", "KIRILIM", "WoE", "KATSAYI", "SKOR", "KATKI", "AUC"].map((h, i) => (
                <th key={i} style={{ textAlign: i === 3 || i === 4 || i === 5 || i === 7 ? "right" : "left", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RISK.appetite.detailFactors.map((f, i) => {
              const pos = f.score > 0;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 600, color: T.ink }}>{f.k}</div>
                  </td>
                  <td style={{ padding: "8px 10px", fontFamily: T.mono, color: T.red, fontWeight: 600 }}>{f.v.split("—")[0]}</td>
                  <td style={{ padding: "8px 10px", color: T.inkSoft, fontSize: 10.5 }}>{f.v.includes("—") ? f.v.split("—")[1] : ""}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: T.mono, color: pos ? T.red : T.green }}>{f.woe > 0 ? "+" : ""}{f.woe.toFixed(3)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: T.mono, color: T.silver }}>{Math.abs(f.score / f.woe).toFixed(3)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: T.mono, fontWeight: 600, color: pos ? T.red : T.green }}>{pos ? "+" : ""}{f.score.toFixed(3)}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", justifyContent: pos ? "flex-start" : "flex-end" }}>
                      <div style={{ width: `${Math.min(Math.abs(f.score) * 200, 100)}%`, height: 8, background: pos ? T.red : T.green }} />
                    </div>
                  </td>
                  {/* Değişken bazlı AUC MOP'tan gelmiyor; önceki sürümdeki değer skordan
                      türetilmiş sahte bir sayıydı (0.55 + |skor|·0.4) — kaldırıldı. */}
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: T.mono, color: T.silver }}>—</td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={5} style={{ padding: "8px 10px", fontStyle: "italic", color: T.silver, fontSize: 10.5 }}>
                <em>SABIT (intercept)</em> &nbsp;&nbsp; <span style={{ color: T.silver }}>Modelin başlangıç bias değeri — popülasyon log-odds</span>
              </td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: T.mono, color: T.silver }}>−0.030</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </Block>

      {/* C. Yangın Risk Segmenti */}
      <Block idx="C" title="Yangın Risk Segmenti" sub="Tarife sınıfı · 5y frekans · 3y ortalama fiyat & komisyon">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div style={{ border: `1px solid ${T.rule}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>YANGIN TARİFE SINIFI</div>
            <div style={{ fontFamily: T.display, fontSize: 36, fontStyle: "italic", color: T.red, marginTop: 6, lineHeight: 1 }}>4</div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 6 }}>Tehlikeli sınıf</div>
          </div>
          <div style={{ border: `1px solid ${T.rule}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>5Y FREKANS HPO</div>
            <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 600, color: T.red, marginTop: 6, lineHeight: 1 }}>165</div>
            {/* Mini sparkline */}
            <svg width="100%" height="20" viewBox="0 0 100 20" style={{ marginTop: 6 }} preserveAspectRatio="none">
              <polyline points="0,15 25,12 50,10 75,7 100,4" fill="none" stroke={T.red} strokeWidth="1.5" />
              {[0,25,50,75,100].map((x, i) => <circle key={i} cx={x} cy={15 - i*3} r="1.5" fill={T.red} />)}
            </svg>
            <div style={{ fontFamily: T.body, fontSize: 10, color: T.red, marginTop: 4 }}>↑ Yükseliyor</div>
          </div>
          <div style={{ border: `1px solid ${T.rule}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>3Y ORT. FİYAT</div>
            <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 600, color: T.red, marginTop: 6, lineHeight: 1 }}>‰2.62</div>
            <svg width="100%" height="20" viewBox="0 0 100 20" style={{ marginTop: 6 }} preserveAspectRatio="none">
              <polyline points="0,14 33,11 66,8 100,6" fill="none" stroke={T.amber} strokeWidth="1.5" />
              {[0,33,66,100].map((x, i) => <circle key={i} cx={x} cy={14 - i*2.5} r="1.5" fill={T.amber} />)}
            </svg>
            <div style={{ fontFamily: T.body, fontSize: 10, color: T.amber, marginTop: 4 }}>Sektör ort. üzerinde</div>
          </div>
          <div style={{ border: `1px solid ${T.rule}`, padding: "14px 16px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>3Y ORT. KOMİSYON</div>
            <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 600, color: T.red, marginTop: 6, lineHeight: 1 }}>%24</div>
            <svg width="100%" height="20" viewBox="0 0 100 20" style={{ marginTop: 6 }} preserveAspectRatio="none">
              <polyline points="0,12 50,9 100,6" fill="none" stroke={T.amber} strokeWidth="1.5" />
              <circle cx="0" cy="12" r="1.5" fill={T.amber} />
              <circle cx="50" cy="9" r="1.5" fill={T.amber} />
              <circle cx="100" cy="6" r="1.5" fill={T.amber} />
            </svg>
            <div style={{ fontFamily: T.body, fontSize: 10, color: T.amber, marginTop: 4 }}>Tavanı zorluyor</div>
          </div>
        </div>
      </Block>

      {/* D. Piyasa Fiyat Çapası */}
      <Block idx="D" title="Piyasa Fiyat Çapası" sub="10Y · 36.911 poliçe · Yangın 112">
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>BÖLGE × YIL FİYAT MATRİSİ ‰</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.mono, fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: "4px 4px", color: T.silver, fontSize: 9, fontWeight: 700, letterSpacing: 1, textAlign: "left" }}>BÖLGE</th>
                  {BENCHMARK.yearLabels.map(y => (
                    <th key={y} style={{ padding: "4px 4px", color: T.silver, fontSize: 9, fontWeight: 700, textAlign: "center" }}>{y}</th>
                  ))}
                  <th style={{ padding: "4px 4px", color: T.red, fontSize: 9, fontWeight: 700, textAlign: "center", borderLeft: `2px solid ${T.red}` }}>10Y</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARK.matrix.map(row => (
                  <tr key={row.z}>
                    <td style={{ padding: "4px 6px", color: T.red, fontWeight: 700 }}>{row.z}</td>
                    {row.years.map((v, i) => {
                      if (v === null) return <td key={i} style={{ padding: "4px 4px", textAlign: "center", background: "repeating-linear-gradient(45deg, #fff, #fff 2px, #f5f5f5 2px, #f5f5f5 4px)", color: T.silver }}>—</td>;
                      // Color scale: <0.8 green, 0.8-1.2 lightgreen, 1.2-1.6 amber, 1.6-2.2 amber-strong, >2.2 bordo
                      let bg = T.greenSoft;
                      if (v >= 2.2) bg = T.redTint;
                      else if (v >= 1.6) bg = T.amberMid;
                      else if (v >= 1.2) bg = T.amberSoft;
                      else if (v >= 0.8) bg = T.oliveSoft;
                      return (
                        <td key={i} style={{ padding: "5px 4px", textAlign: "center", background: bg, color: T.ink, fontSize: 10.5 }}>
                          {v.toFixed(2)}
                        </td>
                      );
                    })}
                    <td style={{ padding: "5px 4px", textAlign: "center", color: T.red, fontWeight: 700, borderLeft: `2px solid ${T.red}`, fontSize: 11 }}>{row.y10.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 0.5 }}>
              <span>FİYAT ‰ (DÜŞÜK</span>
              <div style={{ width: 100, height: 10, background: `linear-gradient(to right, ${T.greenSoft}, ${T.oliveSoft}, ${T.amberSoft}, ${T.amberMid}, ${T.redTint})` }} />
              <span>YÜKSEK)</span>
              <span style={{ marginLeft: "auto", color: T.red, fontWeight: 700 }}>◆ BU RİSK: B1 / 2025</span>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: T.silverBg, fontSize: 11, color: T.inkSoft, fontFamily: T.body, lineHeight: 1.5 }}>
              <strong style={{ color: T.red }}>Sertleşme dalgası:</strong> {BENCHMARK.insight}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>BU RİSKİN ÇAPASI</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ border: `1px solid ${T.rule}`, padding: "10px 12px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 600 }}>BÖLGE 1 / 2025</div>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red, marginTop: 4 }}>2.65<span style={{ fontSize: 12 }}>‰</span></div>
                <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 2 }}>Genel ortalama</div>
              </div>
              <div style={{ background: T.red, color: T.white, padding: "10px 12px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.onBrand, letterSpacing: 1, fontWeight: 600 }}>&gt;8.5M / B1 / 2025</div>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, marginTop: 4 }}>2.58<span style={{ fontSize: 12 }}>‰</span></div>
                <div style={{ fontFamily: T.body, fontSize: 10, color: T.onBrand, marginTop: 2 }}>Bedel bandı çapası</div>
              </div>
              <div style={{ border: `1px solid ${T.rule}`, padding: "10px 12px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 600 }}>FK 6349 / 2025</div>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red, marginTop: 4 }}>1.72<span style={{ fontSize: 12 }}>‰</span></div>
                <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 2 }}>Faaliyet kolu çapası</div>
              </div>
              <div style={{ border: `1px solid ${T.rule}`, padding: "10px 12px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 600 }}>&gt;8.5M / B1 / 3Y</div>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red, marginTop: 4 }}>2.06<span style={{ fontSize: 12 }}>‰</span></div>
                <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkMute, marginTop: 2 }}>Bandın 3Y trendi</div>
              </div>
            </div>
            <div style={{ background: T.greenSoft, borderLeft: `4px solid ${T.green}`, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.green, letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>
                <span>SAPMA · ÇAPAYA POZİSYON</span>
                <span style={{ color: T.silver }}>TEKLİF / ÇAPA</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: T.display, fontSize: 22, fontStyle: "italic", color: T.green, fontWeight: 500 }}>Çapaya yakın</span>
                <span style={{ fontFamily: T.mono, fontSize: 13, color: T.red, fontWeight: 600 }}>2.62‰ / 2.58‰</span>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.green, marginTop: 2, textAlign: "right" }}>+%1.6 · 3Y'a göre +%27.2</div>
              <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
                {BENCHMARK.thisRisk.yorum}
              </div>
            </div>
          </div>
        </div>
      </Block>

      {/* G. Kapasite & Limitler */}
      <Block idx="G" title="Kapasite & Limitler" sub="BDL · Kümül · Treaty · Fakülte · Stratejik uyum">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <FieldRow label="Bedel Aşımı" value={<><span style={{ color: T.red }}>⚠ Aşım var</span></>} valueColor={T.red} />
            <FieldRow label="Kümül Aşımı" value={<><span style={{ color: T.red }}>⚠ Aynı binada 2 mevcut poliçe</span></>} valueColor={T.red} />
            <FieldRow label="BDL (Branş Limit)" value="800 mio ₺" italic={false} />
            <FieldRow label="Kümül (Lokasyon)" value="2980 mio ₺" italic={false} />
            <FieldRow label="Treaty Kullanım" value="%72" italic={false} />
            <FieldRow label="İhtiyari Reasürans" value={<span style={{ color: T.green }}>✓ Hazır</span>} valueColor={T.green} />
            <FieldRow label="Stratejik Uyum & Portföy" value="%108 — Eşik üstü" valueColor={T.amber} />
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>BDL KULLANIMI</div>
            <div style={{ position: "relative", height: 36, background: T.red, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.display, fontSize: 16, fontWeight: 600, fontStyle: "italic" }}>
              197% — AŞIM
              <div style={{ position: "absolute", left: "51%", top: -3, bottom: -3, borderLeft: `2px dashed ${T.white}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 9, color: T.silver, marginTop: 4 }}>
              <span>0</span>
              <span>BDL = 800m</span>
              <span>1.573m</span>
            </div>
            <div style={{ background: T.amberSoft, border: `1px solid ${T.amber}`, padding: "10px 12px", marginTop: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, letterSpacing: 1, fontWeight: 700 }}>FAK. ÖNERİSİ</div>
              <div style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
                BDL aşıldığı için fakülte teyidi gerekiyor. Reasürör ile ön diyalog hazır; tarife sınıfı 4 ve deprem bölgesi 1 nedeniyle kapasite ek prim ile sağlanabilir.
              </div>
            </div>
          </div>
        </div>
      </Block>

      {/* H. Otorizasyon Tetikleyicileri (FESLEĞEN MOP'tan) */}
      <Block idx="H" title="Otorizasyon Tetikleyicileri" sub="Sompo MOP · Bedel/Risk/Müracaat/MASAK kategorileri">
        {isFeslegen ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {(["BDL", "MUAFYT", "RISK_K", "TTS", "İŞVEREN", "MASAK"] as const).map(kat => {
                const count = TEKLIF_FESLEGEN.otorizasyon.filter(o => o.kat === kat).length;
                const palette: Record<string, { bg: string; fg: string; border: string }> = {
                  BDL: { bg: T.amberSoft, fg: T.amber, border: T.amber },
                  MUAFYT: { bg: T.silverBg, fg: T.silverDeep, border: T.silver },
                  RISK_K: { bg: T.redTint, fg: T.red, border: T.red },
                  TTS: { bg: T.silverBg, fg: T.silverDeep, border: T.silver },
                  "İŞVEREN": { bg: T.amberSoft, fg: T.amber, border: T.amber },
                  MASAK: { bg: T.redTint, fg: T.red, border: T.red },
                };
                const c = palette[kat];
                return (
                  <div key={kat} style={{ background: c.bg, padding: "12px 12px", textAlign: "center", borderTop: `3px solid ${c.border}` }}>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: c.fg, letterSpacing: 1.2, fontWeight: 700 }}>{kat}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: c.fg, lineHeight: 1, marginTop: 6 }}>{count}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 9, color: c.fg, marginTop: 4, letterSpacing: 0.5 }}>kayıt</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Otorizasyon tetikleyicileri MOP'tan canlı çekilir — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>

      {/* I. Tarife Sınıfları (FESLEĞEN MOP'tan) */}
      <Block idx="I" title="Tarife Sınıfları" sub="Sompo MOP · Branş bazında tarife konumlama">
        {isFeslegen ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {TEKLIF_FESLEGEN.tarifeSiniflari.map((t, i) => {
              const c = t.cevap >= 4 ? T.red : t.cevap >= 2 ? T.silver : T.green;
              return (
                <div key={i} style={{ border: `1px solid ${T.rule}`, borderTop: `3px solid ${c}`, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.inkSoft, lineHeight: 1.3, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.sinif}</div>
                  <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 600, fontStyle: "italic", color: c, lineHeight: 1, marginTop: 4 }}>{t.cevap}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 8, color: T.silver, marginTop: 4, letterSpacing: 0.5 }}>tarife sınıfı</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Branş bazında tarife sınıflandırması — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//                     STAGE II — RİSK KALİTESİ
// ════════════════════════════════════════════════════════════════════
function StageQuality({ offer, isFeslegen }: { offer: Offer; isFeslegen: boolean }) {
  const cope = RISK.quality.cope;
  return (
    <>
      {/* B. COPE */}
      <Block idx="B" title="COPE Analizi" sub="Construction · Occupancy · Protection · Exposure">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { k: "C", t: "Construction", val: cope.C.score, n: cope.C.note, color: T.green },
            { k: "O", t: "Occupancy", val: cope.O.score, n: cope.O.note, color: T.red },
            { k: "P", t: "Protection", val: cope.P.score, n: cope.P.note, color: T.amber },
            { k: "E", t: "Exposure", val: cope.E.score, n: cope.E.note, color: T.amber },
          ].map((c, i) => (
            <div key={i} style={{ border: `1px solid ${T.rule}`, borderTop: `3px solid ${c.color}`, padding: 14 }}>
              <div style={{ fontFamily: T.display, fontSize: 36, fontWeight: 500, color: c.color, fontStyle: "italic", lineHeight: 1 }}>{c.k}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, marginTop: 4, fontWeight: 600 }}>{c.t.toUpperCase()}</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red, marginTop: 8 }}>{c.val}<span style={{ fontSize: 11, color: T.silver }}>/100</span></div>
              <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{c.n}</div>
            </div>
          ))}
        </div>
      </Block>

      {/* D. Müşteri Hasar Geçmişi */}
      <Block idx="D" title="Müşteri Hasar Geçmişi" sub="Son 5 yıl — sayı · tutar · H/P · büyük hasar · dağılım">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 28 }}>
          <div>
            <FieldRow label="Hasar Sayısı (5y)" value={`${RISK.claims5y.count}`} italic={false} />
            <FieldRow label="Toplam Tutar" value={`${RISK.claims5y.total.toLocaleString("tr-TR")} ₺`} italic={false} />
            <FieldRow label="H/P Oranı (Katastrofsuz)" value={`%${RISK.claims5y.hpRatio}`} valueColor={T.amber} />
            <FieldRow label="Büyük Hasar" value={`${RISK.claims5y.biggest.year} · ${RISK.claims5y.biggest.amount.toLocaleString("tr-TR")} ₺`} valueColor={T.red} />
            <div style={{ background: T.silverBg, borderLeft: `3px solid ${T.red}`, padding: "10px 12px", marginTop: 14 }}>
              <strong style={{ color: T.red, fontFamily: T.body, fontSize: 11 }}>Not:</strong>
              <span style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginLeft: 6, lineHeight: 1.5 }}>{RISK.claims5y.note}</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>HASAR DAĞILIMI</div>
            {RISK.claims5y.distribution.map(d => {
              const max = Math.max(...RISK.claims5y.distribution.map(dd => dd.amount));
              const w = (d.amount / max) * 100;
              const big = d.amount > 5000000;
              return (
                <div key={d.year} style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.inkSoft }}>{d.year}</span>
                  <div style={{ background: T.silverBg, height: 14, position: "relative" }}>
                    <div style={{ background: big ? T.redDeep : T.red, height: "100%", width: `${w}%` }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.silver, textAlign: "right" }}>{(d.amount / 1000).toFixed(0)}k · {d.count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      </Block>

      {/* E. Fiziksel Risk & Konum */}
      <Block idx="E" title="Fiziksel Risk & Konum" sub="Yapı · Yıl · Alan · OSB · Sprinkler · Bitişik nizam">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <FieldRow label="Yapı Tipi" value={RISK.physical.yapiTipi} italic={false} />
            <FieldRow label="Yapım Yılı" value={`${RISK.physical.yapimYili}`} italic={false} />
            <FieldRow label="Toplam Alan" value={RISK.physical.toplamAlan} italic={false} />
            <FieldRow label="OSB / Lokasyon" value={RISK.physical.osb} italic={false} />
          </div>
          <div>
            <FieldRow label="Deprem Bölgesi" value={RISK.physical.deprem} valueColor={T.amber} />
            <FieldRow label="Sprinkler / Dedektör" value={RISK.physical.sprinkler} valueColor={T.amber} />
            <FieldRow label="Bitişik Nizam" value={RISK.physical.bitisik} valueColor={T.amber} />
            <FieldRow label="Geçiş Fonksiyonu" value={RISK.physical.metroFn} italic={false} />
          </div>
        </div>
      </Block>

      {/* F. Risk Kalitesi (Ön) — 6 kart */}
      <Block idx="F" title="Risk Kalitesi (Ön)" sub="Doğal afet · komşuluk · itfaiye uzaklığı">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { k: "DEPREM BÖLGESİ", v: "Bölge 1 — Yüksek", c: T.amber, dikkat: true },
            { k: "SEL RİSKİ", v: "Düşük", c: T.green },
            { k: "HEYELAN RİSKİ", v: "Yok", c: T.green },
            { k: "FAYA UZAKLIK", v: "8.4 km — Orta", c: T.green },
            { k: "İTFAİYE UZAKLIK", v: "1.8 km — İyi", c: T.green },
            { k: "KOMŞULUK RİSKİ", v: "Orta — bitişik OSB tesisi", c: T.amber, dikkat: true },
          ].map((it, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${it.c}`, background: T.white, border: `1px solid ${T.rule}`, padding: "12px 14px" }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>{it.k}</div>
              <div style={{ fontFamily: T.body, fontSize: 13, fontWeight: 500, color: T.ink, marginTop: 4 }}>{it.v}</div>
              {it.dikkat && <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, marginTop: 4, letterSpacing: 0.5, fontWeight: 700 }}>⚠ DİKKAT</div>}
            </div>
          ))}
        </div>
      </Block>

      {/* G. Risk İştahı Matrisi (2x2) */}
      <Block idx="G" title="Risk İştahı Matrisi" sub="Risk Kalitesi × Frekans Loss Ratio">
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, padding: "0 6px 0 0", display: "flex", alignItems: "center", fontWeight: 600 }}>
                RİSK KALİTESİ →
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", border: `1px solid ${T.red}`, height: 200 }}>
                  {[
                    { k: "TL", l: "Hedef İş", c: T.silverDeep, bg: T.white, dot: false },
                    { k: "TR", l: "Hedef Değil", c: T.red, bg: T.redTint, dot: true },
                    { k: "BL", l: "Hedef İş", c: T.silverDeep, bg: T.white, dot: false },
                    { k: "BR", l: "Fiyatla Hedef", c: T.silverDeep, bg: T.white, dot: false },
                  ].map((cell, i) => (
                    <div key={cell.k} style={{
                      background: cell.bg, padding: 10, position: "relative",
                      borderRight: i % 2 === 0 ? `1px solid ${T.rule}` : "none",
                      borderBottom: i < 2 ? `1px solid ${T.rule}` : "none",
                    }}>
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, fontWeight: 600 }}>{cell.k}</div>
                      <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 500, color: cell.c, marginTop: 2 }}>{cell.l}</div>
                      {cell.dot && <div style={{ position: "absolute", left: "50%", top: "60%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: T.red, borderRadius: "50%" }} />}
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, textAlign: "center", marginTop: 6, fontWeight: 600 }}>FREKANS LOSS RATIO →</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.5, fontWeight: 600 }}>POZİSYON</div>
            <h2 style={{ margin: "4px 0 12px", fontFamily: T.display, fontSize: 28, fontStyle: "italic", color: T.red, fontWeight: 500, letterSpacing: -0.4 }}>
              Sol-Üst — Hedef İş
            </h2>
            <p style={{ fontFamily: T.body, fontSize: 12, color: T.inkSoft, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: T.green }}>Risk kalitesi orta</strong>, frekans loss ratio sektör ortalamasının altında — <em>rekabetçi olunabilir</em> bir konumda. Tarife sınıfı 4 olduğundan koşullar kısıtlayıcı şekillenebilir; deprem bölgesi 1 ek bir uyarı.
            </p>
            <div style={{ marginTop: 14, padding: "10px 14px", background: T.greenSoft, borderLeft: `3px solid ${T.green}` }}>
              <span style={{ fontFamily: T.body, fontSize: 11.5, color: T.green, fontWeight: 600 }}>Karar yönlendirmesi:</span>
              <span style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft, marginLeft: 6 }}>Hedef iş adayı — fiyatlama ve teminatla şartlı kabul önerilir.</span>
            </div>
          </div>
        </div>
      </Block>

      {/* H. Saha Beyanları (FESLEĞEN MOP) */}
      <Block idx="H" title="Saha Beyanları" sub="Sompo MOP · Acente form cevapları (Ek Bilgi)">
        {isFeslegen ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
              {TEKLIF_FESLEGEN.ekBilgi.map((it, i) => (
                <div key={i} style={{ background: T.greenSoft, borderLeft: `3px solid ${T.green}`, padding: "8px 10px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 0.5, fontWeight: 600 }}>{it.soru.toUpperCase()}</div>
                  <div style={{ fontFamily: T.body, fontSize: 13, fontWeight: 500, color: T.green, marginTop: 2 }}>{it.cevap}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 10 }}>
              <div style={{ background: T.silverBg, padding: "10px 12px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 600 }}>HEDEF PRİM (BEYAN)</div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: T.red, marginTop: 4 }}>29.000,00 USD</div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, marginTop: 2 }}>Acente çalıştığı tutar</div>
              </div>
              <div style={{ background: T.silverBg, padding: "10px 12px", borderLeft: `3px solid ${T.red}` }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 600 }}>TALEP DETAYI</div>
                <div style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft, marginTop: 4, fontStyle: "italic", lineHeight: 1.5 }}>
                  "{TEKLIF_FESLEGEN.talepDetayi}"
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Saha beyan setleri MOP'tan canlı çekilir — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//                     STAGE III — TEKLİF DİZAYNI
// ════════════════════════════════════════════════════════════════════
function StageDesign({ offer, isFeslegen }: { offer: Offer; isFeslegen: boolean }) {
  return (
    <>
      {/* A. Prim & Komisyon */}
      <Block idx="A" title="Prim & Komisyon" sub="Net · Brüt · Min teknik · Yeterlilik · Sektör ort.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 10 }}>
          <StatCard label="NET PRİM" value={fmtTRY(RISK.premium.netPrim)} accent={T.red} />
          <StatCard label="BRÜT PRİM" value={fmtTRY(RISK.premium.brutPrim)} accent={T.red} />
          <StatCard label="MIN TEKNİK PRİM" value={fmtTRY(RISK.premium.minTeknikPrim)} accent={T.amber} />
          <StatCard label="PRİM YETERLİLİĞİ" value={`%${RISK.premium.primAdequacy}`} accent={T.red} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <StatCard label="SEKTÖR ORT. KOMİSYON" value="%10" />
          <StatCard label="ACENTE TALEBİ" value="%28" soft={T.amberSoft} />
          <StatCard label="FARK" value="+18 puan" soft={T.redSoft} />
        </div>
      </Block>

      {/* B. Karlılık Simülasyonu */}
      <Block idx="B" title="Karlılık Simülasyonu" sub="Reasürans + komisyon + hasar + yatırım = Net kar/zarar">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <StatCard label="BRÜT TEKNİK" value="568.188 ₺" accent={T.green} />
          <StatCard label="NET TEKNİK" value="343.188 ₺" accent={T.green} />
          <StatCard label="YATIRIM GELİRİ" value="152.400 ₺" accent={T.blue} />
          <div style={{ background: T.red, color: T.white, padding: "16px 18px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.onBrand, letterSpacing: 1.5, fontWeight: 600 }}>NET NİHAİ KAR</div>
            <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 700, marginTop: 6, lineHeight: 1.1 }}>495.588 ₺</div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.onBrand, marginTop: 4 }}>Marj: %12.0</div>
          </div>
        </div>

        {/* Hesap Parametreleri */}
        <div style={{ background: T.silverBg, padding: "12px 16px", marginBottom: 16, border: `1px solid ${T.rule}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>HESAP PARAMETRELERİ</div>
          <div className="sm-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
            {[
              { k: "Baz Fiyat", v: PROFIT.params.bazFiyat, n: PROFIT.params.bazFiyatNot },
              { k: "Düzeltme Faktörü", v: `${PROFIT.params.duzeltme}`, n: PROFIT.params.duzeltmeNot },
              { k: "Beklenen HPO", v: PROFIT.params.hpo, n: PROFIT.params.hpoNot },
              { k: "Acente Komisyon", v: PROFIT.params.acenteKomisyon, n: PROFIT.params.acenteKomisyonNot },
              { k: "Reasürans Komisyon", v: PROFIT.params.reasKomisyon, n: PROFIT.params.reasKomisyonNot },
              { k: "Kons. Oranı", v: PROFIT.params.konsOrani, n: PROFIT.params.konsOraniNot },
            ].map((p, i) => (
              <div key={i}>
                <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft }}>{p.k}</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 600, color: T.red, marginTop: 2 }}>{p.v}</div>
                <div style={{ fontFamily: T.body, fontSize: 10, color: T.silver, fontStyle: "italic", marginTop: 1 }}>{p.n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hesap Kaskadı */}
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>
          HESAP KASKADI · GELİR → MALİYET → NET KAR
        </div>
        {PROFIT.kaskad.map((row, i) => {
          // Bar = canlı dolgu, tutar metni = AA geçen koyu ton
          const barMap: Record<string, string> = {
            redDeep: T.redDeep, amber: T.amberFill, green: T.greenFill, red: T.red,
          };
          const textMap: Record<string, string> = {
            redDeep: T.redDeep, amber: T.amber, green: T.green, red: T.red,
          };
          const color = barMap[row.color] || T.redDeep;
          const textColor = textMap[row.color] || T.redDeep;
          return (
            <div key={i}>
              {row.divider && <div style={{ borderTop: `1px solid ${T.red}`, marginTop: 4 }} />}
              <div style={{
                display: "grid", gridTemplateColumns: "260px 1fr 130px", gap: 14, alignItems: "center",
                padding: "8px 0", color: row.bold ? T.red : T.inkSoft,
                fontFamily: T.body, fontSize: row.bold ? 13 : 11.5, fontWeight: row.bold ? 600 : 400,
              }}>
                <span>{row.k}</span>
                <div style={{ background: T.silverBg, height: row.big ? 18 : 14, position: "relative" }}>
                  <div style={{ background: color, height: "100%", width: `${Math.min(row.w, 100)}%` }} />
                </div>
                <span style={{ textAlign: "right", fontFamily: T.mono, color: row.bold ? textColor : T.inkSoft, fontWeight: row.bold ? 700 : 500 }}>
                  {row.v.toLocaleString("tr-TR")} ₺
                </span>
              </div>
            </div>
          );
        })}

        {/* Nihai Karar Matriksi */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>NİHAİ KARAR MATRİKSİ</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.red}` }}>
                {["SONUÇ KALEMİ", "TUTAR", "MARJ", "DURUM"].map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 0 ? "left" : (i === 3 ? "center" : "right"),
                    padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROFIT.matrix.map((row, i) => {
                const neg = row.v < 0;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                    <td style={{ padding: "10px 10px", fontWeight: 500 }}>{row.k}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, fontWeight: 600, color: neg ? T.red : T.ink }}>
                      {row.v.toLocaleString("tr-TR")} ₺
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.silver }}>{row.marj}</td>
                    <td style={{ padding: "10px 10px", textAlign: "center" }}>
                      <Pill status={row.durum as "OK" | "NO"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Verdict bant */}
        <div style={{ background: T.red, color: T.white, padding: "16px 22px", marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.onBrand, letterSpacing: 1.5, fontWeight: 600 }}>KARLILIK VERDICT</div>
            <div style={{ fontFamily: T.display, fontSize: 30, fontStyle: "italic", fontWeight: 500, marginTop: 2, letterSpacing: -0.5 }}>{PROFIT.verdict}</div>
            <div style={{ fontFamily: T.body, fontSize: 11.5, color: T.onBrand, marginTop: 4 }}>{PROFIT.verdictSub}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.onBrand, letterSpacing: 1.5, fontWeight: 600 }}>ÖNERİ</div>
            <div style={{ fontFamily: T.display, fontSize: 26, fontStyle: "italic", fontWeight: 500, marginTop: 2, letterSpacing: -0.4 }}>{PROFIT.oneri}</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.onBrand, marginTop: 4 }}>{PROFIT.oneriSub}</div>
          </div>
        </div>
      </Block>

      {/* D. Teminat Yapısı (FESLEĞEN MOP) */}
      <Block idx="D" title="Teminat Yapısı" sub={`Sompo MOP · ${TEKLIF_FESLEGEN.sigortaBedelleri.totalCount} kalem teminat (ilk 10 listeleniyor)`}>
        {isFeslegen ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ background: T.red, color: T.white, padding: "14px 18px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, color: T.onBrand, fontWeight: 600 }}>TOPLAM SİGORTA BEDELİ</div>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, marginTop: 6 }}>{TEKLIF_FESLEGEN.sigortaBedelleri.toplamBedel.toLocaleString("tr-TR")} USD</div>
              </div>
              <div style={{ background: T.silverBg, padding: "14px 18px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.5, color: T.silver, fontWeight: 600 }}>TOPLAM KAPASİTE</div>
                <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red, marginTop: 6 }}>{TEKLIF_FESLEGEN.sigortaBedelleri.toplamKapasite.toLocaleString("tr-TR")} USD</div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11.5 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.red}` }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>Teminat Kodu / Adı</th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>Bedel (USD)</th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>Fiyat ‰</th>
                  <th style={{ textAlign: "right", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>Prim (USD)</th>
                </tr>
              </thead>
              <tbody>
                {TEKLIF_FESLEGEN.sigortaBedelleri.teminatlar.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                    <td style={{ padding: "9px 10px", fontFamily: T.body, fontSize: 11.5 }}>{t.kod}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: T.mono }}>{t.bedel.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: T.mono, color: T.silver }}>{t.fiyat.toFixed(2)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: T.mono, fontWeight: 600 }}>{t.prim.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.silver, marginTop: 8, textAlign: "right", letterSpacing: 0.5 }}>
              1 - 10 listeleniyor · Toplam {TEKLIF_FESLEGEN.sigortaBedelleri.totalCount} teminat satırı
            </div>
          </>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Detaylı teminat tablosu MOP'tan çekilir — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>

      {/* E. Muafiyet Bilgileri */}
      <Block idx="E" title="Muafiyet Bilgileri" sub={`Sompo MOP · MK + EC bandlı muafiyetler (${TEKLIF_FESLEGEN.muafiyetTotal} kayıt)`}>
        {isFeslegen ? (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11.5 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.red}` }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700, width: "20%" }}>Muafiyet Konusu</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>Muafiyet Açıklaması</th>
                </tr>
              </thead>
              <tbody>
                {TEKLIF_FESLEGEN.muafiyetler.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                    <td style={{ padding: "8px 10px", fontFamily: T.mono, fontSize: 11, fontWeight: 600, fontStyle: "italic", color: T.red }}>{m.konu}</td>
                    <td style={{ padding: "8px 10px", color: T.inkSoft, fontSize: 11, lineHeight: 1.4 }}>{m.aciklama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.silver, marginTop: 8, textAlign: "right" }}>
              1 - 10 listeleniyor · Toplam {TEKLIF_FESLEGEN.muafiyetTotal} muafiyet
            </div>
            <div style={{ marginTop: 12, padding: "10px 14px", background: T.amberSoft, borderLeft: `3px solid ${T.amber}` }}>
              <strong style={{ color: T.amber, fontFamily: T.body, fontSize: 11.5 }}>Otorizasyon tetiği:</strong>
              <span style={{ color: T.inkSoft, fontFamily: T.body, fontSize: 11, marginLeft: 6 }}>"MK BRANŞINDA STANDART GENİŞ KASKO MUAFİYETİNİ SEÇMEDİĞİNİZ İÇİN OTORİZASYONA DÜŞTÜNÜZ" — bantlı yapı standarttan farklı, müdür onayı gerektiriyor.</span>
            </div>
          </>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Muafiyet kalem dağılımı — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>

      {/* F. Riziko Teftiş Uygulamaları */}
      <Block idx="F" title="Riziko Teftiş Uygulamaları" sub="Sompo MOP · RT zorunluluk + başlatma akışı">
        {isFeslegen ? (
          <>
            <div style={{ background: T.amberPale, borderLeft: `4px solid ${T.amber}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ background: T.amber, color: T.white, fontFamily: T.mono, fontSize: 9, fontWeight: 700, padding: "4px 9px", letterSpacing: 1 }}>UYGULAMA M4</span>
              <span style={{ fontFamily: T.body, fontSize: 13, color: T.amber, fontWeight: 600 }}>RT YAPILMALIDIR.</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>RİSK METRİK BİLGİSİ</div>
                <div style={{ background: T.silverBg, border: `1px dashed ${T.rule}`, padding: 18, fontFamily: T.body, fontSize: 13, color: T.red, fontWeight: 600, textAlign: "center" }}>
                  Kayıt bulunmamaktadır
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, marginTop: 8, letterSpacing: 0.5 }}>
                  RM Puanı · Onaylı Form · Ziyaret Tarihi · Ziyaret Eden · Açıklama → tüm sahalar boş
                </div>
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>RT BAŞLATMA FORMU</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { l: "İLGİLİ ADI", t: "text" }, { l: "DEADLINE", t: "date" },
                    { l: "İLETİŞİM NUMARASI", t: "text" }, { l: "RM SEBEBİ", t: "text" },
                  ].map((f, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 0.8, marginBottom: 3, fontWeight: 600 }}>{f.l}</div>
                      <input type={f.t} style={{ width: "100%", padding: 7, border: `1px solid ${T.rule}`, fontFamily: T.body, fontSize: 11, background: T.amberPale, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                <button style={{ width: "100%", padding: 10, background: T.red, color: T.white, border: "none", fontFamily: T.body, fontSize: 12, fontWeight: 600, marginTop: 8, cursor: "pointer", letterSpacing: 0.3 }}>
                  Riziko Teftiş Süreci Başlat
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            RT uygulaması ve başlatma akışı — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>

      {/* G. Müşterek İşler + Bağlı Teklifler */}
      <Block idx="G" title="Müşterek İşler + Bağlı Teklifler" sub="Koasürans / Partaj + Paralel teklif zinciri">
        {isFeslegen ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>MÜŞTEREK İŞLER (KOASÜRANS)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <FieldRow label="Müşterek Mi?" value="Hayır" italic={false} />
                <FieldRow label="Jeran Şirket Kodu:" value="—" italic={false} />
                <FieldRow label="Jeran Şirket Payı:" value="0" italic={false} />
                <FieldRow label="Sigortalı Payı:" value="0" italic={false} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>BAĞLI / İLGİLİ TEKLİFLER</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11.5 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.red}` }}>
                    {["Ürün", "Teklif/Poliçe No", "Başlangıç", "Statü"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TEKLIF_FESLEGEN.ilgiliTeklifler.map((t, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                      <td style={{ padding: "8px 8px", fontFamily: T.mono }}>{t.urunNo}</td>
                      <td style={{ padding: "8px 8px", fontFamily: T.mono, color: T.red, fontWeight: 600, fontStyle: "italic" }}>{t.teklifNo}</td>
                      <td style={{ padding: "8px 8px", fontFamily: T.mono, fontSize: 10.5 }}>{t.baslangicTarihi}</td>
                      <td style={{ padding: "8px 8px", fontFamily: T.mono, fontWeight: 600 }}>{t.policeStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Koasürans ve bağlı teklif yapısı — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>

      {/* G. Müşteri Diğer Akışları */}
      <Block idx="H" title="Müşteri Diğer Akışları" sub="Sompo MOP · Sigortalı + Sigorta Ettiren paralel teklifler">
        {isFeslegen ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.body, fontSize: 11.5 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.red}` }}>
                {["Referans", "Durumu", "Özet", "Branş", "Son Güncellenme", "Partaj"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontFamily: T.mono, fontSize: 9, color: T.red, letterSpacing: 1.2, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEKLIF_FESLEGEN.musteriGecmis.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.ruleSoft}` }}>
                  <td style={{ padding: "10px 10px", fontFamily: T.mono, fontWeight: 600, color: T.red, fontStyle: "italic" }}>{m.ref}</td>
                  <td style={{ padding: "10px 10px", color: T.amber, fontWeight: 600 }}>{m.durum}</td>
                  <td style={{ padding: "10px 10px", color: T.blue }}>{m.ozet}</td>
                  <td style={{ padding: "10px 10px" }}>{m.brans}</td>
                  <td style={{ padding: "10px 10px", fontFamily: T.mono, fontSize: 10.5 }}>{m.date}</td>
                  <td style={{ padding: "10px 10px", fontFamily: T.mono, fontSize: 10.5 }}>{m.partaj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Müşterinin diğer açık akışları MOP'tan çekilir.
          </div>
        )}
      </Block>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//                     STAGE IV — KARAR & ONAY
// ════════════════════════════════════════════════════════════════════
function StageDecision({ offer, isFeslegen }: { offer: Offer; isFeslegen: boolean }) {
  const ac = TEKLIF_FESLEGEN.acente;
  return (
    <>
      {/* A. Sistem Önerisi */}
      <Block idx="A" title="Sistem Önerisi" sub="İştah · Matris · Risk skoru · Karlılık · Nihai sentez">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {/* İŞTAH */}
          <div style={{ background: T.amberSoft, borderTop: `3px solid ${T.amber}`, padding: "14px 14px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.amber, letterSpacing: 1.5, fontWeight: 700 }}>İŞTAH</div>
            <div style={{ fontFamily: T.display, fontSize: 22, fontStyle: "italic", color: T.red, fontWeight: 500, marginTop: 6, lineHeight: 1.1 }}>
              {offer.appetiteBand === "İŞTAH DAHİLİNDE" ? "DAHİL" : offer.appetiteBand === "ŞARTLI" ? "ŞARTLI" : offer.appetiteBand === "DİKKATLİ" ? "DİKKATLİ" : "DIŞI"}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, marginTop: 4 }}>{offer.appetiteScore}/100</div>
          </div>
          {/* MATRİS */}
          <div style={{ background: T.greenSoft, borderTop: `3px solid ${T.green}`, padding: "14px 14px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.green, letterSpacing: 1.5, fontWeight: 700 }}>MATRİS</div>
            <div style={{ fontFamily: T.display, fontSize: 18, fontStyle: "italic", color: T.green, fontWeight: 500, marginTop: 6, lineHeight: 1.1 }}>
              {offer.matrixPos === "TL" ? "Sol-Üst" : offer.matrixPos === "TR" ? "Sağ-Üst" : offer.matrixPos === "BL" ? "Sol-Alt" : "Sağ-Alt"}
            </div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 4 }}>
              {offer.matrixPos === "TL" || offer.matrixPos === "BL" ? "Hedef İş" : offer.matrixPos === "TR" ? "Hedef Değil" : "Fiyatla Hedef"}
            </div>
          </div>
          {/* RİSK SKORU */}
          <div style={{ background: T.blueSoft, borderTop: `3px solid ${T.blue}`, padding: "14px 14px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.blue, letterSpacing: 1.5, fontWeight: 700 }}>RİSK SKORU</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red, marginTop: 6, lineHeight: 1.1 }}>{offer.riskScore}/100</div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 4 }}>{offer.riskBand}</div>
          </div>
          {/* KARLILIK */}
          <div style={{ background: T.greenSoft, borderTop: `3px solid ${T.green}`, padding: "14px 14px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.green, letterSpacing: 1.5, fontWeight: 700 }}>KARLILIK</div>
            <div style={{ fontFamily: T.display, fontSize: 18, fontStyle: "italic", color: T.green, fontWeight: 500, marginTop: 6, lineHeight: 1.1 }}>
              {offer.profitVerdict}
            </div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 4 }}>
              Marj %{offer.profitMargin.toFixed(1)}
            </div>
          </div>
          {/* NİHAİ ÖNERİ */}
          <div style={{ background: T.red, color: T.white, padding: "14px 14px" }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.onBrand, letterSpacing: 1.5, fontWeight: 700 }}>NİHAİ ÖNERİ</div>
            <div style={{ fontFamily: T.display, fontSize: 19, fontStyle: "italic", marginTop: 6, lineHeight: 1.1, fontWeight: 500 }}>
              {offer.appetiteBand === "İŞTAH DAHİLİNDE" && offer.profitVerdict === "KARLI" ? "Kabul" :
               offer.appetiteBand === "İŞTAH DIŞI" || offer.profitVerdict === "ZARAR" ? "Red" :
               "Şartlı Kabul"}
            </div>
            <div style={{ fontFamily: T.body, fontSize: 10.5, color: T.onBrand, marginTop: 4 }}>
              Fak. + RT + komisyon revize
            </div>
          </div>
        </div>
      </Block>

      {/* B. Onay Akışı */}
      <Block idx="B" title="Onay Akışı" sub="Yetki zinciri · Aşama durumu">
        <div style={{ position: "relative" }}>
          {[
            { num: "1", name: "UW (Yusuf Saçan)", role: "HAZIRLAYAN", status: "TAMAM", date: "24.02.2026 10:14", color: T.green },
            { num: "2", name: "Yangın TK Müdürü", role: "İLK ONAY", status: "ONAYDA", date: "—", color: T.amber },
            { num: "3", name: "Endüstriyel Riskler GMY", role: "YETKİ AŞIMI", status: "BEKLİYOR", date: "—", color: T.silver },
            { num: "4", name: "Reasürans", role: "FAK. ONAY", status: "BEKLİYOR", date: "—", color: T.silver },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative", paddingBottom: i === arr.length - 1 ? 0 : 22 }}>
              {i < arr.length - 1 && (
                <div style={{ position: "absolute", left: 17, top: 36, bottom: 0, borderLeft: `1.5px dashed ${T.silverLight}` }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: step.status === "TAMAM" ? T.green : step.status === "ONAYDA" ? T.amber : T.white,
                border: `2px solid ${step.color}`, color: step.status === "BEKLİYOR" ? T.silver : T.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.mono, fontSize: 14, fontWeight: 700, position: "relative", zIndex: 1,
              }}>{step.num}</div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontFamily: T.body, fontSize: 14, fontWeight: 600, color: T.ink }}>{step.name}</div>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.silver, letterSpacing: 1.5, marginTop: 2, fontWeight: 600 }}>{step.role}</div>
              </div>
              <div style={{ textAlign: "right", paddingTop: 4 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: step.color, letterSpacing: 1.2, fontWeight: 700 }}>{step.status}</div>
                <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, marginTop: 2 }}>{step.date}</div>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* C. Önerilen Aksiyonlar */}
      <Block idx="C" title="Önerilen Aksiyonlar" sub="Kabul için yapılması gerekenler">
        {[
          "RT raporu temin edilmeli (M4)",
          "Bedel aşımı için fak. teyidi alınmalı",
          "Komisyon tavanı %18'e çekilmeli",
          "Deprem muafiyeti %5'e sabitlenmeli",
          "Stratejik eşik için yazılı GMY mutabakatı",
        ].map((aksiyon, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 18, padding: "12px 0", borderBottom: i < 4 ? `1px solid ${T.ruleSoft}` : "none" }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.red, fontStyle: "italic", letterSpacing: 0.5, minWidth: 24 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: T.body, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5 }}>{aksiyon}</span>
          </div>
        ))}
      </Block>

      {/* E. Acente Künyesi */}
      <Block idx="E" title="Acente Künyesi" sub="Sompo MOP · Partaj kayıt + sorumlu UW + sınıflandırma">
        {isFeslegen ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>KİMLİK & SORUMLU</div>
              <FieldRow label="Partaj:" value={ac.partaj} valueColor={T.red} />
              <FieldRow label="Unvan:" value={ac.unvan} italic={false} />
              <FieldRow label="Sınıfı:" value={ac.sinif} italic={false} />
              <FieldRow label="Açılış Yılı:" value={ac.acilisYili} italic={false} />
              <FieldRow label="UW Sorumlusu:" value={ac.uwSorumlusu} valueColor={T.red} />
              <FieldRow label="Tahsilat Sorumlusu:" value={ac.tahsilatSorumlusu} italic={false} />
              <FieldRow label="Protokol Durumu:" value={ac.protokolDurumu} italic={false} />
            </div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>YETKİ & SATICI</div>
              <FieldRow label="Bağlı Olduğu Grup:" value={ac.bagliGrup} italic={false} />
              <FieldRow label="Satıcı İsmi:" value={ac.saticiIsmi} italic={false} />
              <FieldRow label="Satıcı Bölge:" value={ac.saticiBolge} italic={false} />
              <FieldRow label="Acente Durumu:" value={ac.durum} valueColor={T.red} />
              <FieldRow label="Kt Yetki Grubu:" value={ac.ktYetkiGrubu} italic={false} />
              <FieldRow label="Çalışma Grubu:" value={ac.calismaGrubu} italic={false} />
              <FieldRow label="KIO:" value={`${ac.kio}`} italic={false} />
            </div>
          </div>
        ) : (
          <div style={{ padding: 14, textAlign: "center", fontFamily: T.body, fontSize: 11, color: T.inkMute, fontStyle: "italic", background: T.silverBg }}>
            Acente künyesi MOP'tan canlı çekilir — pilot FESLEĞEN üzerinde dolu.
          </div>
        )}
      </Block>

      {/* H. Sonuç */}
      <Block idx="H" title="Sonuç" sub="Sompo MOP · Final karar formu">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 1fr 1.2fr", gap: 18, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>Onay Türü:</div>
            <div style={{ fontFamily: T.mono, fontSize: 14, color: T.silverDeep }}>—</div>
          </div>
          <div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>Onay Detayı:</div>
            <div style={{ fontFamily: T.mono, fontSize: 14, color: T.silverDeep }}>—</div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.blue, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>HEDEF İŞ</div>
            <select style={{
              width: "100%", padding: "8px 10px", fontFamily: T.body, fontSize: 12,
              border: `2px solid ${T.red}`, color: T.red, fontWeight: 600,
              background: T.white, outline: "none", cursor: "pointer",
            }}>
              <option>Seçiniz</option>
              <option>Hedef İş</option>
              <option>Hedef Değil</option>
              <option>Fiyatla Hedef</option>
            </select>
          </div>
          <div>
            <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>Öneri Var Mı?</div>
            <div style={{ fontFamily: T.body, fontSize: 13, color: T.ink, fontWeight: 500 }}>Hayır</div>
          </div>
          <button style={{
            padding: "12px 16px", background: T.red, color: T.white,
            border: "none", fontFamily: T.body, fontSize: 13, fontWeight: 700,
            cursor: "pointer", letterSpacing: 0.3,
          }}>
            Üzerime Al →
          </button>
        </div>
      </Block>

      {/* I. MOP Yorumları */}
      <Block idx="I" title="MOP Yorumları" sub="Yorumlar · Belgeler · SLA · Tarihçe (sekme yapısı)">
        {/* Tab strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 0, position: "relative" }}>
          {["YORUMLAR", "BELGELER (1)", "SLA LİSTESİ", "TARİHÇE", "BEKLEME SÜRELERİ", "İLGİLİ İŞLER", "GRAFİKSEL AKIŞ", "UW BELGELERİ", "UW YORUMLARI", "ÖZEL GRUP"].map((tab, i) => {
            const active = i === 0;
            return (
              <button key={tab} style={{
                padding: "7px 12px",
                fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1,
                background: active ? T.red : T.white,
                color: active ? T.white : T.silver,
                border: `1px solid ${active ? T.red : T.rule}`,
                borderBottom: active ? `1px solid ${T.red}` : `1px solid ${T.rule}`,
                cursor: "pointer",
              }}>{tab}</button>
            );
          })}
        </div>
        <div style={{ borderTop: `2px solid ${T.red}`, marginTop: -1, paddingTop: 14 }}>
          {TEKLIF_FESLEGEN.yorumlar.map((y, i) => (
            <div key={i} style={{ background: T.silverBg, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: T.body, fontSize: 12, fontWeight: 700, color: T.red }}>{y.user}</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.silver }}>· {y.date}</span>
                {y.restricted && (
                  <span style={{
                    fontFamily: T.mono, fontSize: 9, fontWeight: 700, padding: "2px 8px",
                    background: T.red, color: T.white, letterSpacing: 0.8,
                  }}>KISITLI</span>
                )}
              </div>
              <div style={{ fontFamily: T.body, fontSize: 11.5, color: T.inkSoft, lineHeight: 1.6, whiteSpace: "pre-line" }}>{y.text}</div>
            </div>
          ))}
          <button style={{
            marginTop: 10, padding: "8px 14px", background: T.silverBg,
            border: `1px solid ${T.rule}`, color: T.red,
            fontFamily: T.body, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
          }}>Yorum Ekle</button>
        </div>
      </Block>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//                    KARAR MATRİSİ — Sticky sidebar
// ════════════════════════════════════════════════════════════════════
function KararMatrisi({ offer, stage }: { offer: Offer; stage: string }) {
  const apColor = offer.appetiteBand === "İŞTAH DAHİLİNDE" ? T.green : offer.appetiteBand === "ŞARTLI" ? T.amber : offer.appetiteBand === "DİKKATLİ" ? T.amber : T.red;
  const profitColor = offer.profitVerdict === "KARLI" ? T.green : offer.profitVerdict === "SINIRDA" ? T.amber : offer.profitVerdict === "REVİZE" ? T.amber : T.red;

  return (
    <div style={{ background: T.white, border: `1px solid ${T.rule}` }}>
      {/* Header */}
      <div style={{ background: T.red, color: T.white, padding: "12px 14px" }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.onBrand, letterSpacing: 2, fontWeight: 600 }}>KALICI</div>
        <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 500, fontStyle: "italic", marginTop: 2 }}>Karar Matrisi</div>
      </div>

      {/* İştah + Risk skoru */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ borderTop: `2px solid ${apColor}`, padding: "8px 10px", background: T.paper }}>
            <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>İŞTAH</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: apColor, marginTop: 2 }}>{offer.appetiteScore}<span style={{ fontSize: 11, color: T.silver }}>/100</span></div>
            <div style={{ fontFamily: T.mono, fontSize: 8.5, color: apColor, letterSpacing: 0.4, marginTop: 2, fontWeight: 600 }}>{offer.appetiteBand}</div>
          </div>
          <div style={{ borderTop: `2px solid ${T.blue}`, padding: "8px 10px", background: T.paper }}>
            <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.2, fontWeight: 600 }}>RİSK</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.blue, marginTop: 2 }}>{offer.riskScore}<span style={{ fontSize: 11, color: T.silver }}>/100</span></div>
            <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.blue, letterSpacing: 0.4, marginTop: 2, fontWeight: 600 }}>{offer.riskBand}</div>
          </div>
        </div>
      </div>

      {/* Mini Matris */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>POZİSYON · 2×2 MATRİS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", border: `1px solid ${T.red}`, height: 100, position: "relative" }}>
          {(["TL", "TR", "BL", "BR"] as MatrixPos[]).map((pos, i) => (
            <div key={pos} style={{
              background: pos === "TR" ? T.redTint : T.white,
              borderRight: i % 2 === 0 ? `1px solid ${T.rule}` : "none",
              borderBottom: i < 2 ? `1px solid ${T.rule}` : "none",
              padding: 4, fontFamily: T.mono, fontSize: 8, color: T.silver, position: "relative",
            }}>
              {pos}
              {pos === offer.matrixPos && (
                <div style={{ position: "absolute", left: "50%", top: "60%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: T.red, border: "1.5px solid #fff", borderRadius: "50%", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: T.body, fontSize: 11, color: T.inkSoft, marginTop: 6, fontStyle: "italic", textAlign: "center" }}>
          {offer.matrixPos === "TL" || offer.matrixPos === "BL" ? "Hedef İş" : offer.matrixPos === "TR" ? "Hedef Değil" : "Fiyatla Hedef"}
        </div>
      </div>

      {/* Karlılık */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.5, fontWeight: 600 }}>KARLILIK</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: profitColor }}>
            {offer.profitMargin >= 0 ? "+" : ""}{offer.profitMargin.toFixed(1)}<span style={{ fontSize: 13 }}>%</span>
          </span>
          <span style={{
            fontFamily: T.mono, fontSize: 9, fontWeight: 700, padding: "2px 8px",
            background: profitColor, color: T.white, letterSpacing: 0.8,
          }}>{offer.profitVerdict}</span>
        </div>
      </div>

      {/* Onay Durumu */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>ONAY DURUMU</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%",
            background: offer.status === "Onaylandı" ? T.green : offer.status === "Reddedildi" ? T.red : T.amber }} />
          <span style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: offer.status === "Onaylandı" ? T.green : offer.status === "Reddedildi" ? T.red : T.amber }}>
            {offer.status}
          </span>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.silver, marginTop: 4 }}>UW: {offer.uw}</div>
      </div>

      {/* Kritik Metrikler */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>KRİTİK METRİKLER</div>
        {[
          { k: "S. Bedeli", v: `${(offer.sumInsured / 1e6).toFixed(0)} mio ₺` },
          { k: "Brüt Prim", v: `${(offer.grossPremium / 1e3).toFixed(0)}k ₺` },
          { k: "Fiyat", v: `${offer.pricePpm.toFixed(2)}‰` },
          { k: "Çapa Sapma", v: `${offer.benchmarkDelta >= 0 ? "+" : ""}${offer.benchmarkDelta.toFixed(1)}%`, c: Math.abs(offer.benchmarkDelta) < 5 ? T.green : Math.abs(offer.benchmarkDelta) < 15 ? T.amber : T.red },
          { k: "Bölge / Tarife", v: `B${offer.zone} / T${offer.tarife}` },
        ].map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontFamily: T.body, fontSize: 11 }}>
            <span style={{ color: T.inkSoft }}>{m.k}</span>
            <span style={{ fontFamily: T.mono, fontWeight: 600, color: m.c || T.ink }}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* 10y Portföy Davranış Çapası */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}`, background: T.silverBg }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.red, letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>10Y PORTFÖY DAVRANIŞI</div>
        {(() => {
          const bolge = MASTER.bolge.find(b => b.z === offer.zone);
          const k = MASTER.karar(offer.profitMargin >= 0 ? 100 - offer.profitMargin * 2 : 60, offer.zone, offer.sumInsured / 1e6);
          const colorMap: Record<string, string> = { green: T.green, amber: T.amber, red: T.red };
          const c = colorMap[k.renk];
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 8, color: T.silver, letterSpacing: 0.8 }}>BU BÖLGE 10Y HPO</div>
                  <div style={{ fontFamily: T.mono, fontSize: 14, color: bolge && bolge.sapma > 5 ? T.red : bolge && bolge.sapma > 0 ? T.amber : T.green, fontWeight: 700 }}>%{bolge?.hp.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 8, color: T.silver, letterSpacing: 0.8 }}>BREAK-EVEN</div>
                  <div style={{ fontFamily: T.mono, fontSize: 14, color: T.silverDeep, fontWeight: 700 }}>%{bolge?.breakeven}</div>
                </div>
              </div>
              <div style={{ background: T.white, padding: "6px 8px", borderLeft: `3px solid ${c}` }}>
                <div style={{ fontFamily: T.mono, fontSize: 9, color: c, fontWeight: 700, letterSpacing: 0.8 }}>{k.tip}</div>
                <div style={{ fontFamily: T.body, fontSize: 10, color: T.inkSoft, marginTop: 2, lineHeight: 1.3 }}>{bolge?.note}</div>
              </div>
              {offer.sumInsured > MASTER.parametre.capMaxKons && (
                <div style={{ background: T.amberSoft, padding: "5px 8px", marginTop: 6, fontFamily: T.body, fontSize: 9.5, color: T.amber, fontWeight: 600 }}>
                  ⚠ 8.5M cap aşımı → surplus cede zorunlu
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Acente */}
      <div style={{ padding: 14, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.5, fontWeight: 600, marginBottom: 4 }}>ACENTE</div>
        <div style={{ fontFamily: T.body, fontSize: 11.5, color: T.red, fontWeight: 600, fontStyle: "italic" }}>{offer.agentName}</div>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.silver, marginTop: 2 }}>{offer.agentSegment}</div>
      </div>

      {/* Aktif Bayraklar */}
      <div style={{ padding: 14 }}>
        <div style={{ fontFamily: T.mono, fontSize: 8.5, color: T.silver, letterSpacing: 1.5, fontWeight: 600, marginBottom: 6 }}>AKTİF BAYRAKLAR</div>
        {offer.flags.length === 0 ? (
          <div style={{ fontFamily: T.body, fontSize: 11, color: T.green, fontStyle: "italic" }}>✓ Aktif bayrak yok</div>
        ) : (
          offer.flags.map((f, i) => (
            <div key={i} style={{
              fontFamily: T.body, fontSize: 10.5, padding: "5px 8px", marginBottom: 3,
              background: T.amberSoft, borderLeft: `3px solid ${T.amber}`, color: T.amber, fontWeight: 600,
            }}>
              {f}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
