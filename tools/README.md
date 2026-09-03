# Teminat fiyat hesabı (yangın / deprem)

Bir teklif ya da poliçenin teminat listesinden **yangın fiyatı** ve **deprem fiyatı**nı,
poliçede **hangi teminatlar varsa** onlarla hesaplar. Eksik teminat hata değildir —
o grup sadece mevcut kodlarla toplanır.

## Temel kural

Fiyat sütunu **binde (‰)** yazılır:

```
prim = bedel × fiyat / 1000
```

```
YANGIN FİYATI = (yangın grubu primi) / (sabit kıymet bedeli) × 1000
DEPREM FİYATI = (deprem primi)       / (deprem bedeli)       × 1000
```

- **Payda (sigorta bedeli):** yalnızca kendi bedelini taşıyan kalemler — sabit kıymetler
  (bina, makina-tesisat, demirbaş, emtea, dekorasyon, muhteviyat, kasa, temeller, reçete,
  3. şahıs emtea). Poliçede bunlardan hangileri varsa onlar toplanır.
- **Pay (prim):** sabit kıymet primi + yangına ek teminat primleri + terör primi.
  Terör hariç istenirse `--terorsuz`.
- **Bedeli olmayan gruplar:** yangına ek teminatlar (fırtına, dahili su, kar ağırlığı,
  yer kayması, duman, kara/hava taşıtları çarpması, enkaz kaldırma) ve terör kendi bedelini
  taşımaz; aynı sabit kıymet bedeli üzerinden fiyatlanır. Bedelleri toplanırsa yangın bedeli
  mükerrer şişer — script bunları paydaya eklemez.
- **Limit satırları** (yıllık azami, poliçe süresi toplam limit, en yüksek makina bedeli)
  hiçbir bedele girmez.
- **Deprem** kendi bedeli ve kendi fiyatıyla ayrı hesaplanır; poliçede deprem-EC veya
  deprem-hareketli makina gibi ek deprem kalemleri varsa ağırlıklı fiyat çıkar.

## Kullanım

```bash
python3 tools/teminat_fiyat.py teklif.xls            # .xls / .xlsx / .csv
python3 tools/teminat_fiyat.py teklif.csv --detay    # teminat bazında döküm
python3 tools/teminat_fiyat.py teklif.xls --terorsuz # terörü yangın priminden çıkar
python3 tools/teminat_fiyat.py teklif.xls --json     # makine okunur çıktı
```

`.xls` (eski BIFF) için: `pip install xlrd`. CSV noktalı virgül ve Türkçe sayı
biçimini (`1.234.567,89`) tanır.

## Teminat kodu → grup eşleştirmesi

`teminat_gruplari.py` içindeki `KOD_GRUP` tablosu. Kod tabloda yoksa teminat **adına**
bakılır (`AD_KURALLARI`), böylece yeni/şirkete özel kodlar da doğru gruba düşer.
Yeni bir kod çıktığında tabloya bir satır eklemek yeterlidir.

## Bilinen bulgu — 03.09.2026, `excelListe_4.xls`

O teklifte: sabit kıymet bedeli 13.486.127,50 → **yangın fiyatı 0,01 ‰** (5 teminatın
hepsinde tek fiyat), ekler tek fiyat **0,001 ‰** (7 teminat + enkaz fiyatsız),
**deprem 2,63 ‰** (ağırlıklı 2,62838), toplam prim 50.239,73 (%71'i deprem).

Kıyaslanan raporun ürettiği `POLICE_FIYAT 1,39212935` / `DEPREM_POLICE 2,38092411` /
`YANGIN 1,23` değerleri bu dosyadan çıkmıyor: `DEPREM_HAR = -0,9887948` tam olarak
`POLICE_FIYAT − DEPREM_POLICE`, yani rapor farklı paydalar üzerinden hesaplanmış iki
fiyatı birbirinden çıkarıyor. Ayrıca `1,23` için gereken yangın primi 16.587,94 iken
o poliçedeki deprem hariç primin tamamı 14.576,28 — matematiksel olarak mümkün değil.
