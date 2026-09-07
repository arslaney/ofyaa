# UW Asistanı — Karar Matrisi (v14)

Sompo Sigorta Yangın Teknik Kabul için underwriting karar konsolu.
Tek dosyalık React bileşeni: `uw_asistani.tsx`.

## Bu sürümde ne oldu

### 1. İki dal birleştirildi
Elde ayrışmış iki sürüm vardı; hiçbiri diğerinin üst kümesi değildi:

| Katman | v13 | remixed | v14 |
|---|---|---|---|
| MASTER (10 yıl · 38.146 poliçe) | var | **yok** | var |
| Portföy Davranış Atlası | var | **yok** | var |
| Karar Matrisi canlı simülatör | var | **yok** | var |
| RoleBar · ROLES · 2026 yetki mektubu | **yok** | var | var |
| REGIONS · TEAM · Bölge-Ekip matrisi | **yok** | var | var |
| Yetki zinciri · eskalasyon rotası | **yok** | var | var |

Taban remix alındı, v13'ün düşen Atlas katmanı geri eklendi ve
dashboard'a sekme yapısı (Teklif Havuzu / Portföy Davranış Atlası)
geri getirildi.

### 2. Sompo kurumsal kimliği
- Palet "bordo #9B1B1B" ekseninden **Global Ring kırmızısı #C8102E**
  eksenine taşındı; koyu ton #8E0B20, platin halka nötrleri ve siyah
  (#161616) yazı ekseni logodan türetildi.
- Logo yeniden çizildi: yatay kilit (işaret + SOMPO yazısı), halka
  küreyle gerçekten kenetleniyor — sol-alt yayı önden, sağ-üst yayı
  arkadan geçiyor (kesişim kirişi üzerinden `clipPath`).
- `useId` ile gradient kimlikleri benzersiz: aynı sayfada iki logo
  render edilirse artık bozulmuyor.

### 3. Kontrast — WCAG 2.2 AA
Metin taşıyan her token beyaz, #FAFAFA ve #F4F4F4 zeminlerde ≥ 4.5:1.
Ölçülen düzeltmeler:

| Öğe | Önce | Sonra |
|---|---|---|
| `silver` caption (144 kullanım) | 2.38:1 | 5.10:1 |
| `inkMute` yardımcı metin | 3.54:1 | 6.39:1 |
| `amber` uyarı metni | 3.06:1 | 5.93:1 |
| "Üzerime Al" butonu | 1.50:1 | 5.88:1 |
| Isı haritası "—" | 1.40:1 | 5.10:1 |
| Y.UW rol rengi | 3.54:1 | 6.39:1 |
| İCAP rozeti | 2.70:1 | 5.34:1 |
| TAHSİLAT rozeti | 4.12:1 | 6.37:1 |

Canlı ama açık tonlar yalnızca dolgu olarak kaldı — adları `*Fill`
ile biter ve metin rengi olarak kullanılmamalıdır.

### 4. Düzeltilen hatalar
- **NET PRİM** `3.300.000 ₺` yerine `3,300 ₺` yazıyordu; **BRÜT PRİM**
  `4,125.000 ₺` (karışık ayraç) idi. `fmtTRY()` ile düzeltildi.
- MIN TEKNİK PRİM ve PRİM YETERLİLİĞİ sabit metindi → veriden okunuyor.
- StageDesign'da iki blok birden "G" harfliydi → ikincisi "H".
- Değişken bazlı **AUC sütunu uydurmaydı** (`0.55 + |skor|·0.4`, skorun
  yeniden ölçeklenmişi — bağımsız bilgi taşımıyordu). Sütun korundu,
  değerler "—" oldu. Gerçek AUC MOP'tan bağlanmalı.
- Footer sürümleri tutarsızdı (v13 / v12) → v14.
- Sarı trafik ışığı dolgusu koyu kahveye kayıyordu → gerçek amber.

### 5. Erişilebilirlik ve daralma
- `GlobalStyle` katmanı: satır içi stiller `:hover` / `:focus-visible` /
  `@media` yazamaz; odak halkaları, hover ve kırılma noktaları buradan.
- Teklif satırları klavyeyle erişilebilir (`tabIndex`, Enter/Space,
  `aria-label`) — önceden yalnız fareyle çalışıyordu.
- Portföy matrisi noktaları `<span onClick>` yerine `<button>`.
- Ana teklif tablosu yatay kayan kaba alındı; sayfa gövdesi kaymıyor.
- 1180px ve 860px kırılmaları; `prefers-reduced-motion` ve yazdırma.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `uw_asistani.tsx` | Kaynak. Claude artifact'ini güncellemek için bunu yapıştırın. |
| `uw-asistani.html` | Tek dosya, kendi kendine yeten sürüm. React gömülü; çift tıklayınca açılır, kurulum gerekmez. Yazı tipleri için internet ister; yoksa sistem yazı tipine düşer, işlev aynı kalır. |
| `build-entry.tsx` | Derleme girişi. |

## Derleme

```bash
npm i react@18.3.1 react-dom@18.3.1 esbuild@0.24.0
npx esbuild build-entry.tsx --bundle --minify --format=iife \
  --outfile=bundle.js --loader:.tsx=tsx --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' --target=es2020
```

## Bilinen açıklar
- Değişken bazlı AUC verisi MOP'tan bağlanmalı.
- Kenar çubuğundaki 10y çapa bloğu, HPO'yu kar marjından türetiyor
  (`100 - marj*2`) — yer tutucu, gerçek HPO ile değiştirilmeli.
- Çok dar ekranlarda bazı derin ızgaralar hâlâ sabit kolonlu.
