# Poliçe fiyat raporu — formül hatası ve düzeltmesi

Pivot rapordaki (`POLICE NO` / `DEPREM BOLGE KODU` kırılımı) yangın ve deprem fiyat
sütunları hatalı. Hata iki poliçelik örnekte birebir doğrulandı.

## Doğru çalışan tek sütun

```
POLICE_FIYAT = ORT_PRIM / ORT_SB_YANGIN_TEMINAT_TUTARI × 1000        ✔
```

| Poliçe | ORT_PRIM | ORT_SB | Hesap | Rapor |
|---|---:|---:|---:|---:|
| 112000000131921 | 1.445.677 | 1.422.756.000 | 1,0161103 | 1,01611012 |
| 112000000133761 | 240.087 | 91.100.000 | 2,6354226 | 2,63541921 |
| Grand Total | 842.882 | 756.928.000 | 1,1135564 | 1,113556019 |

(Küsurat farkı yalnızca ekranda yuvarlanmış prim tutarından geliyor.)

## Hata: `(1 + oran)` fazlalığı

```
YANLIŞ:  DEPREM_POLICE_FIYAT = POLICE_FIYAT × (1 + DEPREM_PRIM)
DOĞRU :  DEPREM_POLICE_FIYAT = POLICE_FIYAT ×      DEPREM_PRIM
```

Doğrulama — `DEPREM_POLICE_FIYAT / POLICE_FIYAT` her satırda tam olarak `1 + DEPREM_PRIM`:

| Poliçe | Oran | DEPREM_PRIM sütunu |
|---|---:|---:|
| 112000000131921 | 1,5517365 | %55,17 |
| 112000000133761 | 1,9753823 | %97,54 |
| Grand Total | 1,6120722 | %61,21 |

Zincirleme sonuçlar:

- `DEPREM_HARIC_FIYAT_POLICE = POLICE_FIYAT − DEPREM_POLICE_FIYAT` formülü doğru ama
  girdisi bozuk olduğu için **negatif** çıkıyor. Mutlak değeri tam olarak **gerçek deprem
  fiyatı**dır (−0,560625005 → deprem fiyatı 0,560625005).
- `DEPREM_FIYAT` (son sütun) her satırda `POLICE_FIYAT` ile birebir aynı → yanlış hücre
  referansı, deprem fiyatıyla ilgisi yok.
- `YANGIN FIYAT YENI 106 112` poliçe fiyatının %98-99'u; yani **deprem primi hâlâ içinde**.
  Deprem primi %97,54 olan poliçede bile 2,578 gösteriyor (gerçek yangın fiyatı 0,0104).
- `ORT_FIYAT_0` sütunu sabit 0.

## Düzeltilmiş formüller

```
POLICE_FIYAT   = ORT_PRIM / ORT_SB_YANGIN_TEMINAT_TUTARI × 1000
DEPREM_FIYAT   = POLICE_FIYAT × DEPREM_PRIM
YANGIN_FIYAT   = POLICE_FIYAT × YANGIN_PRIM
DEPREM_HARIC   = POLICE_FIYAT × (1 − DEPREM_PRIM)     # yangın + diğer branşlar
```

| Poliçe | POLICE_FIYAT | DEPREM % | DEPREM_FIYAT | YANGIN_FIYAT | DEPREM HARİÇ |
|---|---:|---:|---:|---:|---:|
| 112000000131921 | 1,016110 | %55,17 | 0,560625 | 0,452907 | 0,455485 |
| 112000000133761 | 2,635419 | %97,54 | 2,570541 | 0,010420 | 0,064878 |
| Grand Total | 1,113556 | %61,21 | 0,681577 | 0,426280 | 0,431979 |

`YANGIN_FIYAT` ile `DEPREM HARİÇ` arasındaki küçük fark, yangın da deprem de olmayan
teminatların primi (poliçe 1'de %0,25, poliçe 2'de %2,07).

## Grand Total uyarısı

`DEPREM_PRIM` genel toplamı prim ağırlıklı doğru hesaplanmış (%61,21 ✔), ama
`YANGIN PRIM` genel toplamı **0,424248284** yazıyor. Ağırlıklı doğrusu **0,382809**.
Mevcut hâliyle yangın + deprem = 1,0363 > 1 çıkıyor, yani genel toplam satırı tutarsız.

## Not

`ORT_SB_YANGIN_TEMINAT_TUTARI`, teklif bazında `tools/teminat_fiyat.py`nin
`SABIT_KIYMET` grubu olarak topladığı tutarın aynısıdır (bkz. `tools/README.md`).
