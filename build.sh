#!/usr/bin/env bash
# Builds the static site from src/ into the repo root (what Vercel serves).
# Edit files in src/ only — the generated .html files are overwritten.
#
#   bash build.sh
#
# Each page in src/pages/ starts with a front-matter comment:
#   <!--
#   title: ...
#   description: ...
#   path: /services/chatbot        (URL of this page)
#   alt: /en/services/chatbot      (same page in the other language)
#   robots: noindex                (optional; also keeps it out of the sitemap)
#   -->
set -euo pipefail
shopt -u patsub_replacement 2>/dev/null || true
export LC_ALL=C.UTF-8 2>/dev/null || true
cd "$(dirname "$0")"

# ---- Site settings (change contact details here only) ----
SITE="https://www.mowazefai.com"
WA_NUMBER="96265236672"
PHONE_DISPLAY="+962 6 523 6672"
PHONE_TEL="+96265236672"
EMAIL="info@mowazefai.com"
VERSION="$(date +%Y%m%d%H%M)"
FONTS_AR="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600&display=swap"
FONTS_EN="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600&display=swap"

meta() { sed -n "s/^$1: //p" "$2" | head -1 | tr -d '\r'; }

urlenc() {
  local s="$1" out="" c i
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      ' ') out+="%20" ;; '&') out+="%26" ;; '?') out+="%3F" ;; '#') out+="%23" ;;
      "'") out+="%27" ;; '"') out+="%22" ;; '+') out+="%2B" ;; *) out+="$c" ;;
    esac
  done
  printf '%s' "$out"
}

sub() { # sub VAR_NAME TOKEN VALUE  — literal replace in the named variable
  local -n ref="$1"
  ref="${ref//"$2"/"$3"}"
}

SITEMAP_ENTRIES=""
count=0

while IFS= read -r -d '' src; do
  title=$(meta title "$src")
  desc=$(meta description "$src")
  path=$(meta path "$src")
  alt=$(meta alt "$src")
  nav=$(meta nav "$src")
  robots=$(meta robots "$src"); robots=${robots:-index, follow}

  if [[ "$path" == /en* || "$path" == "/404-en" ]]; then
    lang=en; dir=ltr; fonts="$FONTS_EN"; ogl=en_US; ogl_alt=ar_JO; skip="Skip to content"
    ar_path="$alt"; en_path="$path"
  else
    lang=ar; dir=rtl; fonts="$FONTS_AR"; ogl=ar_JO; ogl_alt=en_US; skip="انتقل إلى المحتوى"
    ar_path="$path"; en_path="$alt"
  fi

  body=$(awk 'f{print} /^-->/{f=1}' "$src")
  page="$(cat src/partials/head.html)
$(cat "src/partials/header.$lang.html")
$body
$(cat "src/partials/footer.$lang.html")"

  # {{include:name}} -> contents of src/partials/name.html
  inc_re='\{\{include:([a-z.-]+)\}\}'
  while [[ "$page" =~ $inc_re ]]; do
    inc="${BASH_REMATCH[1]}"
    sub page "{{include:$inc}}" "$(cat "src/partials/$inc.html")"
  done

  sub page '{{TITLE}}' "$title"
  sub page '{{DESC}}' "$desc"
  sub page '{{LANG}}' "$lang"
  sub page '{{DIR}}' "$dir"
  sub page '{{PATH}}' "$path"
  sub page '{{AR_PATH}}' "$ar_path"
  sub page '{{EN_PATH}}' "$en_path"
  sub page '{{SWITCH_PATH}}' "$alt"
  sub page '{{ROBOTS}}' "$robots"
  sub page '{{FONTS}}' "${fonts//&/&amp;}"
  sub page '{{OG_LOCALE}}' "$ogl"
  sub page '{{OG_LOCALE_ALT}}' "$ogl_alt"
  sub page '{{SKIP}}' "$skip"
  if [[ $lang == ar ]]; then sub page '{{SITE_NAME}}' "موظف AI"; else sub page '{{SITE_NAME}}' "Mowazef AI"; fi
  sub page '{{SITE}}' "$SITE"
  sub page '{{EMAIL}}' "$EMAIL"
  sub page '{{PHONE_DISPLAY}}' "$PHONE_DISPLAY"
  sub page '{{PHONE_TEL}}' "$PHONE_TEL"
  sub page '{{VERSION}}' "$VERSION"
  [[ -n "$nav" ]] && sub page "data-nav=\"$nav\"" "data-nav=\"$nav\" aria-current=\"page\""

  # href="wa:Message text" -> WhatsApp link with the message pre-filled
  while IFS= read -r m; do
    [[ -z "$m" ]] && continue
    msg="${m#href=\"wa:}"; msg="${msg%\"}"
    sub page "$m" "href=\"https://wa.me/$WA_NUMBER?text=$(urlenc "$msg")\""
  done < <(printf '%s' "$page" | grep -o 'href="wa:[^"]*"' | sort -u || true)

  # {{i:name}} / {{if:name}} -> sprite icons (if = flipped in RTL)
  page=$(printf '%s\n' "$page" | sed \
    -e 's|{{i:\([a-z-]*\)}}|<svg aria-hidden="true"><use href="/assets/img/icons.svg#\1"/></svg>|g' \
    -e 's|{{if:\([a-z-]*\)}}|<svg class="flip" aria-hidden="true"><use href="/assets/img/icons.svg#\1"/></svg>|g')

  if [[ "$page" == *"{{"* ]]; then
    echo "ERROR: unreplaced token in $src:" >&2
    printf '%s' "$page" | grep -o '{{[^}]*}}' | sort -u >&2
    exit 1
  fi

  case "$path" in
    /) out="index.html" ;;
    /en) out="en/index.html" ;;
    /404) out="404.html" ;;
    *) out="${path#/}.html" ;;
  esac
  mkdir -p "$(dirname "$out")"
  printf '%s\n' "$page" > "$out"
  count=$((count + 1))

  if [[ "$robots" != *noindex* ]]; then
    SITEMAP_ENTRIES+="  <url>
    <loc>$SITE$path</loc>
    <xhtml:link rel=\"alternate\" hreflang=\"ar\" href=\"$SITE$ar_path\"/>
    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"$SITE$en_path\"/>
    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"$SITE$ar_path\"/>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
  </url>
"
  fi
done < <(find src/pages -name '*.html' -print0 | sort -z)

cat > sitemap.xml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
$SITEMAP_ENTRIES</urlset>
EOF

echo "built $count pages + sitemap.xml"
