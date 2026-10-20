# Swapy kart görünümü

Mevcut Ofyaa sade HTML/JS uygulamasına, normal `/studio/` adresinde varsayılan olarak açılan bir React adası eklenmiştir. Giriş, korumalı API, senaryo kararları ve yayın kayıtları mevcut uygulamada kalır. Kartlar, mevcut özel kayıttaki Codex koordinatör bağlantısını, son/sonraki kontrolü ve talep sonuçlarını gösterir. Koordinatör 15 dakikalık kontrollerle çalışır; tarayıcı ajan yürütmez.

## Kurulum ve yapı

`npm ci`, `npm run typecheck:studio`, `npm run build:studio` komutlarını çalıştırın. Derlenmiş `studio/cards.js` ve `studio/cards.css` Vercel ile birlikte dağıtılır; ayrıca bir geliştirme sunucusu gerekmez. Derleyici için Tailwind Node API kullanılır; dosya izleme servisi çalışmaz.

Bileşen `components/ui/swapy-draggable-card.tsx`, ortak `cn` yardımcısı `lib/utils.ts`, ekran `src/studio/main.tsx`, stiller `src/studio/cards.css` içindedir. `@/` kök dizine çözümlenir; `components.json` shadcn dizin ve stil yollarını tanımlar. `components/ui` kullanıcı arayüzü parçalarını ekran kodundan ayırır ve shadcn import yollarını sabit tutar. TypeScript kapsamı stüdyo kaynaklarıyla sınırlıdır. Tailwind `tw:` öneki ve preflight kullanılmaması eski sitenin stillerine müdahaleyi önler.

## Davranış

Kartları düzenle ile Swapy sürükleme açılır. Klavyede tutamacın ok tuşları ve önceye/sonraya al düğmeleri aynı işi yapar. Yalnız kart kimliklerinin sırası bu tarayıcıdaki localStorage alanına kaydedilir. Yerleşim sıfırlanabilir. Ölçüm olmayan yerlerde tire görünür; gerçek sıfır sayımları sıfır kalır. Platformların ölçüm kapsamı açıklanır. Takvim aynı mevcut yayın kayıtlarını pastel kartlarla gösterir; planlı kayıt yayımlanmış gibi sunulmaz.

Private snapshot yalnız mevcut giriş kontrolünden sonra React adasına aktarılır. Oturum kapatıldığında React ağacı kaldırılır. Yeni görsel görünüm ek API anahtarı, ayrı veri tabanı, ajan çalıştırma veya yayın yetkisi yaratmaz.

Telefon ana ekranı da `/studio/` açar ve renkli görünümü kullanır. Sade görünüm için `?layout=classic` seçilebilir; eski `?layout=cards` bağlantıları çalışmaya devam eder.
