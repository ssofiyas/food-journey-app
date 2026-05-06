
# Master Life -tyylinen redesign

Muutetaan nykyinen MealCraft visuaalisesti ja rakenteellisesti vastaamaan kuvailemaasi Master Life -sovellusta. Pidetään olemassa oleva backend (Lovable Cloud + edge-funktiot), mutta uudistetaan ulkoasu ja navigaatio.

## 1. Visuaalinen järjestelmä (`src/index.css` + `tailwind.config.ts`)

Korvataan nykyinen iOS-sininen palette pastelli-glowmorphism -palettiin:

- **Värit (HSL-tokenit)**
  - `--primary`: korallipinkki `#E85D8A` → `342 75% 64%`
  - `--accent`: laventeli `#D4B5F0` → `272 70% 83%`
  - `--peach` (uusi token): `22 100% 76%` (`#FFAD85`)
  - `--background`: pehmeä vaaleanpunainen liukuväri laventeliin (radial gradient body-tasolla)
  - Teksti: tummanvioletti `260 25% 18%`
- **Fontit**: lisätään `@fontsource/plus-jakarta-sans` (otsikot) ja `@fontsource/inter` (body); päivitetään `--font-display` ja `--font-body`
- **Radius**: `--radius: 1.25rem`
- **Varjot/efektit**
  - `--shadow-glass`: syvä pehmeä `0 20px 60px -20px hsl(342 75% 64% / .25)`
  - `--shadow-glow`: hehku `0 0 40px hsl(342 75% 64% / .35)`
  - `--gradient-primary`: korallista persikkaan
  - `--gradient-hero`: monikerroksinen radial-liukuväri (taustalle)
- **Glass-utility** päivitetään: `backdrop-filter: blur(24px) saturate(1.6)`, valkoinen rajaviiva, pehmeä varjo

## 2. Navigaatio — uusi BottomNav (6 tabia)

Päivitetään nykyinen `MobileBottomNav` 6 välilehteen Master Life -järjestyksessä:

```
Home  |  Health  |  Kitchen  |  Explore  |  Academy  |  Profile
```

- Kitchen korostuu keskellä (suurempi pastilli-painike, glow-varjo)
- Aktiivinen tab: pinkki/laventeli pilleri + soft glow
- Glassmorphic alapalkki, kelluu 12px reunoista, `safe-area-bottom`

Sama rakenne desktop-sivupalkissa (sidebar saa saman pastel-glow -ilmeen).

## 3. Sivurakenteen muutokset

Olemassa olevat sivut säilyvät, mutta saavat uuden hero-tyylin (gradient-tausta, glass-kortit, Plus Jakarta -otsikot). Konkreettiset muutokset:

- **Home / Dashboard**
  - Animoitu SVG **Readiness-rengas** ylös (Framer Motion `pathLength`)
  - Stat-kortit: kalorit, askeleet, vesi — klikattavissa (vesi +1 lasi, askeleet manuaalinen syöttö)
  - **AI Nutrition Coach** -kortti: yksi vinkki, joka perustuu `user_onboarding.goals`-arvoon (painonpudotus / lihasmassa / parempi uni). Vinkki haetaan olemassa olevasta Lovable AI -gateway -funktiosta (uusi edge `nutrition-coach-tip`).
  - Päivän suunnitelma: näyttää tänään logatut `meal_plans` (already exists) ja suunnitellut ateriat

- **Kitchen** (uusi sivu, korvaa nykyisen Recipe-keskittymän)
  - 4 lohkoa glass-korteissa:
    1. **AI Photo Scan** → käyttää nykyistä `analyze-plate` edge-funktiota, lisätään "Log to today" -nappi joka kirjoittaa `meal_plans`-tauluun
    2. **Recipe Inspiration** → hakuruutu, käyttää nykyistä reseptihakua
    3. **Fridge Raid AI** → linkki olemassa olevaan `fridge-raid`-funktioon
    4. **Nutrition** → upotettu paneeli (ostoslista + viikkosuunnitelma)

- **Health** (HealthHub) — säilytetään, mutta uudella visuaalilla
- **Explore, Academy, Profile** — säilytetään toiminnoiltaan, vain tyylit päivitetään

## 4. Reaaliaikainen sync

Lisätään Dashboardiin Supabase Realtime -kuuntelu `meal_plans`-tauluun (today's date), jotta Kitchenin "Log to today" päivittää Dashboardin välittömästi. Käytetään olemassa olevaa taulua — ei uusia migraatioita.

## 5. Mobiilioptimoituus

- Kaikki uudet kortit `max-w-md mx-auto` mobiilissa, grid desktopissa
- `safe-area-inset-bottom`/`-top` huomioitu
- Testataan 390×844 ja 1280×720

## 6. Animaatiot

- Sivusiirtymät: Framer Motion fade + y-liuku (jo käytössä — laajennetaan kaikkiin sivuihin)
- Napit: `whileTap={{ scale: 0.96 }}`
- Skannaus: pulssanimaatio kuvan päällä
- Modaalit: scale + fade

## Mitä EI muuteta

- Tietokannan skeema (käytetään olemassa olevia `meal_plans`, `daily_health_logs`, jne. — ei tarvita uutta `meal_logs`-taulua, koska `meal_plans` täyttää saman tarpeen)
- Olemassa oleva auth, RLS, edge-funktiot
- i18n-järjestelmä (laajennetaan vain käännöksiä uusille teksteille)

## Toteutusjärjestys (yksi viesti per vaihe)

1. Design tokenit + fontit + glass-utilityt
2. Uusi BottomNav (6 tabia, Kitchen korostettu)
3. Kitchen-sivu (4 lohkoa) + reaaliaikainen sync `meal_plans` ↔ Dashboard
4. Dashboard-uudistus (readiness-rengas, AI coach -kortti, päivän suunnitelma)
5. Muiden sivujen visual refresh

---

Vahvista, niin aloitan vaiheesta 1 (design system + nav). Voit myös sanoa "tee kaikki kerralla" jos haluat täyden redesignin yhdellä iteraatiolla.
