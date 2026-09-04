#!/usr/bin/env bash
# يبني index.html المستقل من mowazafai-landing.html (المصدر الوحيد للتعديل)
set -e
cd "$(dirname "$0")"

SRC="mowazafai-landing.html"
OUT="index.html"

SPLIT=$(grep -n '^</style>$' "$SRC" | head -1 | cut -d: -f1)
head -n "$SPLIT" "$SRC" > .head.part
tail -n +"$((SPLIT + 1))" "$SRC" > .body.part

{
  printf '%s\n' '<!doctype html>' '<html lang="ar" dir="rtl">' '<head>' \
    '<meta charset="utf-8">' \
    '<meta name="viewport" content="width=device-width, initial-scale=1">' \
    '<meta name="description" content="موظف AI يرد على مكالمات عيادتك أول رنّة بلهجة سعودية، يجاوب عن الخدمات والأسعار، ويحجز المواعيد في تقويمك ٢٤ ساعة.">' \
    '<meta name="theme-color" content="#0B3A38">' \
    '<link rel="icon" href="favicon.svg" type="image/svg+xml">' \
    '<meta property="og:type" content="website">' \
    '<meta property="og:locale" content="ar_SA">' \
    '<meta property="og:site_name" content="موظف AI">' \
    '<meta property="og:title" content="موظف AI — يرد أول رنّة، وما يفوّت موعد.">' \
    '<meta property="og:description" content="موظف استقبال صوتي لعيادات الرياض: يرد ٢٤ ساعة بلهجة سعودية، يجاوب عن الخدمات والأسعار، ويحجز في تقويم عيادتك.">' \
    '<meta property="og:url" content="https://mowazafai.com/">' \
    '<meta name="twitter:card" content="summary_large_image">' \
    '<link rel="canonical" href="https://mowazafai.com/">'
  cat .head.part
  printf '%s\n' '</head>' '<body>'
  cat .body.part
  printf '%s\n' '</body>' '</html>'
} > "$OUT"

rm -f .head.part .body.part
echo "built $OUT ($(wc -c < "$OUT") bytes)"
