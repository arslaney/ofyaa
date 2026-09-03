#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Teklif/police teminat listesinden YANGIN ve DEPREM fiyatini hesaplar.

Kural: fiyat "binde" (per mille) yazilir -> prim = bedel * fiyat / 1000.

Hesap yalnizca POLICEDE MEVCUT teminatlarla yapilir; eksik teminat hata degildir.

    YANGIN FIYATI  = (yangin grubu primi) / (sabit kiymet bedeli) * 1000
    DEPREM FIYATI  = (deprem primi)       / (deprem bedeli)       * 1000

Yangin grubu primi = sabit kiymet + yangina ek teminatlar (+ teror, --terorsuz ile haric).
Paydaya sadece BEDEL tasiyan kalemler girer; ek teminatlar ayri bedel tasimaz
(ayni sabit kiymet bedeli uzerinden fiyatlanir), limit satirlari hic girmez.

Kullanim:
    python3 tools/teminat_fiyat.py teklif.xls
    python3 tools/teminat_fiyat.py teklif.csv --json
    python3 tools/teminat_fiyat.py teklif.xls --terorsuz --detay
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from teminat_gruplari import grup_bul  # noqa: E402

# Yangin fiyatinin PAYDASINI (sigorta bedelini) olusturan gruplar
BEDEL_GRUPLARI = ("SABIT_KIYMET",)
# Yangin fiyatinin PAYINA (prime) giren gruplar
YANGIN_PRIM_GRUPLARI = ("SABIT_KIYMET", "EK_TEMINAT", "TEROR")
# Kendi bedeli olmayan gruplar: sabit kiymet bedeli uzerinden fiyatlanirlar,
# bedelleri toplanirsa yangin bedeli mukerrer sisar. LIMIT satirlari da bedel degildir.
BEDELSIZ_GRUPLAR = ("EK_TEMINAT", "TEROR", "LIMIT")


def _sayi(v):
    """'1.234.567,89' / '1,234,567.89' / 1234.5 -> float."""
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(" ", "").replace("\xa0", "")
    if not s:
        return 0.0
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".") if s.rfind(",") > s.rfind(".") else s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def satirlari_oku(yol):
    """(kod, ad, bedel, fiyat, prim) listesi dondurur. .xls/.xlsx/.csv destekler."""
    uzanti = os.path.splitext(yol)[1].lower()
    if uzanti in (".csv", ".txt", ".tsv"):
        import csv
        with open(yol, encoding="utf-8-sig", newline="") as f:
            ornek = f.read(4096); f.seek(0)
            ayirac = ";" if ornek.count(";") > ornek.count(",") else ","
            ham = [r for r in csv.reader(f, delimiter=ayirac) if any(c.strip() for c in r)]
    else:
        try:
            import xlrd
        except ImportError:
            sys.exit("Bu dosya icin xlrd gerekli:  pip install xlrd")
        sh = xlrd.open_workbook(yol).sheet_by_index(0)
        ham = [[sh.cell_value(r, c) for c in range(sh.ncols)] for r in range(sh.nrows)]

    satirlar = []
    for r in ham:
        if len(r) < 4:
            continue
        ad_hucre = str(r[0]).strip()
        if not ad_hucre or "teminat" in ad_hucre.lower():   # baslik satiri
            continue
        m = re.match(r"^\s*(\d+)\s*-\s*(.*)$", ad_hucre)    # "10-BINA"
        kod, ad = (m.group(1), m.group(2).strip()) if m else ("", ad_hucre)
        satirlar.append({
            "kod": kod, "ad": ad,
            "bedel": _sayi(r[1]), "fiyat": _sayi(r[2]), "prim": _sayi(r[3]),
            "grup": grup_bul(kod, ad),
        })
    return satirlar


def hesapla(satirlar, teror_dahil=True):
    yangin_prim_gruplari = YANGIN_PRIM_GRUPLARI if teror_dahil else ("SABIT_KIYMET", "EK_TEMINAT")

    gruplar = {}
    for s in satirlar:
        g = gruplar.setdefault(s["grup"], {"bedel": 0.0, "prim": 0.0, "adet": 0, "kodlar": []})
        # Ek teminat / teror / limit satirlari kendi bedelini tasimaz
        if s["grup"] not in BEDELSIZ_GRUPLAR:
            g["bedel"] += s["bedel"]
        g["prim"] += s["prim"]
        g["adet"] += 1
        g["kodlar"].append(s["kod"] or s["ad"])

    def gb(*adlar): return sum(gruplar.get(a, {}).get("bedel", 0.0) for a in adlar)
    def gp(*adlar): return sum(gruplar.get(a, {}).get("prim", 0.0) for a in adlar)

    yangin_bedel = gb(*BEDEL_GRUPLARI)
    yangin_prim = gp(*yangin_prim_gruplari)
    deprem_bedel, deprem_prim = gb("DEPREM"), gp("DEPREM")
    toplam_prim = sum(s["prim"] for s in satirlar)

    def binde(prim, bedel):
        return round(prim / bedel * 1000, 5) if bedel else None

    return {
        "yangin": {"bedel": yangin_bedel, "prim": yangin_prim, "fiyat_binde": binde(yangin_prim, yangin_bedel),
                   "teror_dahil": teror_dahil},
        "deprem": {"bedel": deprem_bedel, "prim": deprem_prim, "fiyat_binde": binde(deprem_prim, deprem_bedel)},
        "police": {"toplam_prim": round(toplam_prim, 2),
                   "deprem_haric_prim": round(toplam_prim - deprem_prim, 2),
                   "deprem_prim_orani": round(deprem_prim / toplam_prim, 4) if toplam_prim else None,
                   "fiyat_binde": binde(toplam_prim, yangin_bedel),
                   "deprem_haric_fiyat_binde": binde(toplam_prim - deprem_prim, yangin_bedel)},
        # Bedelsiz gruplarin fiyati yangin (sabit kiymet) bedeli uzerinden hesaplanir
        "gruplar": {ad: {"bedel": round(g["bedel"], 2), "prim": round(g["prim"], 2), "adet": g["adet"],
                         "bedel_referansi": ad in BEDELSIZ_GRUPLAR,
                         "fiyat_binde": binde(g["prim"], yangin_bedel if ad in BEDELSIZ_GRUPLAR else g["bedel"]),
                         "kodlar": g["kodlar"]}
                    for ad, g in sorted(gruplar.items())},
    }


def _tl(x): return f"{x:,.2f}".replace(",", "@").replace(".", ",").replace("@", ".")
def _bd(x): return "-" if x is None else f"{x:.5f}".rstrip("0").rstrip(".").replace(".", ",")


def yazdir(s, satirlar, detay=False):
    y, d, p = s["yangin"], s["deprem"], s["police"]
    print(f"\n{'GRUP':<18}{'ADET':>5}{'BEDEL':>20}{'PRIM':>14}{'FIYAT (binde)':>16}")
    print("-" * 73)
    for ad, g in s["gruplar"].items():
        bedel = "(sabit kiymet)" if g["bedel_referansi"] else _tl(g["bedel"])
        print(f"{ad:<18}{g['adet']:>5}{bedel:>20}{_tl(g['prim']):>14}{_bd(g['fiyat_binde']):>16}")
    print("-" * 73)
    tdh = "teror dahil" if y["teror_dahil"] else "teror haric"
    print(f"\nYANGIN FIYATI : {_bd(y['fiyat_binde'])} binde   ({tdh}; prim {_tl(y['prim'])} / bedel {_tl(y['bedel'])})")
    print(f"DEPREM FIYATI : {_bd(d['fiyat_binde'])} binde   (prim {_tl(d['prim'])} / bedel {_tl(d['bedel'])})")
    oran = f" (%{p['deprem_prim_orani'] * 100:.1f})" if p["deprem_prim_orani"] is not None else ""
    print(f"\nToplam prim      : {_tl(p['toplam_prim'])}   | deprem {_tl(d['prim'])}{oran}")
    print(f"Deprem haric prim: {_tl(p['deprem_haric_prim'])}")
    print(f"Police fiyati (toplam prim / yangin bedeli): {_bd(p['fiyat_binde'])} binde")
    print(f"Deprem haric fiyat                        : {_bd(p['deprem_haric_fiyat_binde'])} binde")
    if detay:
        print(f"\n{'KOD':<7}{'TEMINAT':<32}{'GRUP':<18}{'BEDEL':>18}{'FIYAT':>9}{'PRIM':>13}")
        print("-" * 97)
        for r in satirlar:
            print(f"{r['kod']:<7}{r['ad'][:31]:<32}{r['grup']:<18}"
                  f"{_tl(r['bedel']):>18}{_bd(r['fiyat']):>9}{_tl(r['prim']):>13}")


def main():
    ap = argparse.ArgumentParser(description="Teklif teminat listesinden yangin/deprem fiyati hesaplar")
    ap.add_argument("dosya", help="teminat listesi (.xls / .xlsx / .csv)")
    ap.add_argument("--terorsuz", action="store_true", help="teroru yangin priminden cikar")
    ap.add_argument("--detay", action="store_true", help="teminat bazinda dokum")
    ap.add_argument("--json", action="store_true", help="cikti JSON")
    a = ap.parse_args()

    satirlar = satirlari_oku(a.dosya)
    if not satirlar:
        sys.exit("Dosyada teminat satiri bulunamadi.")
    sonuc = hesapla(satirlar, teror_dahil=not a.terorsuz)
    if a.json:
        print(json.dumps({"sonuc": sonuc, "satirlar": satirlar}, ensure_ascii=False, indent=2))
    else:
        yazdir(sonuc, satirlar, detay=a.detay)


if __name__ == "__main__":
    main()
