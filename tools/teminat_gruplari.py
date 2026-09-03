# -*- coding: utf-8 -*-
"""Teminat kodu -> grup eslestirmesi.

Amac: bir teklif/police listesinde HANGI teminatlar varsa onlarla yangin ve
deprem fiyatini hesaplayabilmek. Eksik teminat hata degildir; o grup sadece
mevcut kodlarla toplanir.

Gruplar
-------
SABIT_KIYMET      Yangin sigorta bedelini olusturan kiymetler (yangin fiyatinin PAYDASI)
EK_TEMINAT        Yangina ek riskler; ayri bedel tasimaz, sabit kiymet bedeli uzerinden fiyatlanir
TEROR             GLKHHKNH / teror; ek teminat gibi ayni bedel uzerinden fiyatlanir
DEPREM            Deprem teminatlari (kendi bedeli ve kendi fiyati var)
YMM               Yangin mali mesuliyet (komsuluk, kiraci/malik)
FINANSAL_KAYIP    Kira kaybi, is durmasi, alternatif isyeri
HIRSIZLIK / CAM / MAKINA_KIRILMASI / ELEKTRONIK   Yangin disi brans teminatlari
SORUMLULUK        IMM, 3.SMM, isveren, ferdi kaza vb. (prim tarifeden gelir, bedel/fiyat iliskisi yoktur)
LIMIT             Bedel degil limit satiri (yillik azami, en yuksek makina bedeli vb.) -> hicbir bedele eklenmez
DIGER             Siniflanamayan
"""

KOD_GRUP = {
    # --- Sabit kiymetler (yangin sigorta bedeli) ---
    "10": "SABIT_KIYMET",    # BINA
    "40": "SABIT_KIYMET",    # EMTEA
    "50": "SABIT_KIYMET",    # MAKINA-TESISAT
    "58": "SABIT_KIYMET",    # DEKORASYON
    "60": "SABIT_KIYMET",    # DEMIRBAS
    "89": "SABIT_KIYMET",    # RECETE VE KUPUR
    "201": "SABIT_KIYMET",   # TEMELLER (DEPREM) -> bedel kalemi
    "1061": "SABIT_KIYMET",  # 3.SAHIS EMTEA
    "1380": "SABIT_KIYMET",  # MUHTEVIYAT (ILK ATES)
    "3210": "SABIT_KIYMET",  # KASA

    # --- Yangina ek teminatlar (ayri bedel yok) ---
    "100": "EK_TEMINAT",     # KAR AGIRLIGI
    "110": "EK_TEMINAT",     # ENKAZ KALDIRMA
    "130": "EK_TEMINAT",     # DAHILI SU
    "140": "EK_TEMINAT",     # FIRTINA
    "150": "EK_TEMINAT",     # KARA TASITLARI CARPMASI
    "180": "EK_TEMINAT",     # HAVA TASITLARI CARPMASI
    "190": "EK_TEMINAT",     # YER KAYMASI
    "200": "EK_TEMINAT",     # DUMAN
    "90": "TEROR",           # G.L.K.H.H.K.N.H - TEROR

    # --- Deprem ---
    "211": "DEPREM", "216": "DEPREM", "220": "DEPREM", "397": "DEPREM",

    # --- Yangin mali mesuliyet ---
    "121": "YMM", "122": "YMM", "128": "YMM",

    # --- Finansal kayiplar ---
    "300": "FINANSAL_KAYIP", "310": "FINANSAL_KAYIP", "351": "FINANSAL_KAYIP",

    # --- Yangin disi branslar ---
    "240": "HIRSIZLIK", "246": "HIRSIZLIK", "1320": "HIRSIZLIK",
    "1351": "HIRSIZLIK", "1355": "HIRSIZLIK", "1365": "HIRSIZLIK", "92": "HIRSIZLIK",
    "250": "CAM",
    "390": "MAKINA_KIRILMASI",
    "400": "ELEKTRONIK", "94": "ELEKTRONIK",

    # --- Limit satirlari (bedel degil) ---
    "298": "LIMIT", "304": "LIMIT", "392": "LIMIT", "277": "LIMIT",

    # --- Sorumluluk / sahis ---
    "134": "SORUMLULUK", "276": "SORUMLULUK", "291": "SORUMLULUK",
    "301": "SORUMLULUK", "302": "SORUMLULUK", "303": "SORUMLULUK",
    "526": "SORUMLULUK", "580": "SORUMLULUK", "585": "SORUMLULUK",
    "592": "SORUMLULUK", "594": "SORUMLULUK",
    "5542": "SORUMLULUK", "5544": "SORUMLULUK", "5545": "SORUMLULUK",
    "5570": "SORUMLULUK",

    # --- Diger ---
    "63": "DIGER", "64": "DIGER", "153": "DIGER", "695": "DIGER", "8910": "DIGER",
}

# Kod tabloda yoksa ada bakarak sinifla (sirali; ilk eslesme kazanir)
AD_KURALLARI = [
    ("DEPREM",           "DEPREM"),
    ("YANGIN SOR",       "YMM"),
    ("Y.M.M",            "YMM"),
    ("KIRA KAYBI",       "FINANSAL_KAYIP"),
    ("IS DURMASI",       "FINANSAL_KAYIP"),
    ("ALTERNATIF",       "FINANSAL_KAYIP"),
    ("ENKAZ",            "EK_TEMINAT"),
    ("FIRTINA",          "EK_TEMINAT"),
    ("DAHILI SU",        "EK_TEMINAT"),
    ("KAR AGIRLIGI",     "EK_TEMINAT"),
    ("YER KAYMASI",      "EK_TEMINAT"),
    ("DUMAN",            "EK_TEMINAT"),
    ("CARPMASI",         "EK_TEMINAT"),
    ("TEROR",            "TEROR"),
    ("G.L.K.H",          "TEROR"),
    ("HIRSIZLIK",        "HIRSIZLIK"),
    ("KASK",             "HIRSIZLIK"),
    ("CAM KIRILMASI",    "CAM"),
    ("MAKINA KIRILMASI", "MAKINA_KIRILMASI"),
    ("ELEKTRONIK",       "ELEKTRONIK"),
    ("YILLIK AZAMI",     "LIMIT"),
    ("TOPLAM LIMIT",     "LIMIT"),
    ("EN YUKSEK",        "LIMIT"),
    ("M.M",              "SORUMLULUK"),
    ("MESULIYET",        "SORUMLULUK"),
    ("MANEVI",           "SORUMLULUK"),
    ("KAZA",             "SORUMLULUK"),
    ("BINA",             "SABIT_KIYMET"),
    ("EMTEA",            "SABIT_KIYMET"),
    ("DEMIRBAS",         "SABIT_KIYMET"),
    ("MAKINA-TESISAT",   "SABIT_KIYMET"),
    ("KASA",             "SABIT_KIYMET"),
    ("DEKORASYON",       "SABIT_KIYMET"),
    ("MUHTEVIYAT",       "SABIT_KIYMET"),
    ("TEMELLER",         "SABIT_KIYMET"),
    ("RECETE",           "SABIT_KIYMET"),
]

_TR = str.maketrans("İIıŞşĞğÜüÖöÇç", "IIiSsGgUuOoCc")


def _norm(s: str) -> str:
    return (s or "").translate(_TR).upper()


def grup_bul(kod: str, ad: str) -> str:
    """Once kod tablosuna, kod yoksa teminat adina bakar."""
    kod = (kod or "").strip()
    if kod in KOD_GRUP:
        return KOD_GRUP[kod]
    ad_n = _norm(ad)
    for anahtar, grup in AD_KURALLARI:
        if anahtar in ad_n:
            return grup
    return "DIGER"
