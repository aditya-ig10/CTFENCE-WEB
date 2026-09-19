# Context Fence — Design System (Consolidated)

> Source: exhaustive audit of `mcp-firewall` (`design.md:1`, `frontend/src/styles.css`, `frontend/src/components/Layout.tsx`, `frontend/src/pages/*`) on 2026-09-26. This file is the single reference for the CTFENCE website + dashboard to stay visually identical to the shipped app.

Sources of truth in the dashboard repo:

| File | Role |
|---|---|
| `frontend/src/styles.css` | Global tokens + shared component classes |
| `frontend/src/components/Layout.tsx` | App shell, liquid-glass sidebar |
| `frontend/src/components/Toasts.tsx` + `.cf-glass-toast` | Liquid-glass toasts |
| `frontend/src/components/ConnectorCard.tsx` | Connector card editorial pattern |
| Each page co-located `<style>` | Page-scoped styling (`db-`, `ag-`, `au-`, `fw-`, `cx-`, `mk-`, `auth-`, `set-`) |
| `app/globals.css` (CTFENCE website) | Marketing site tokens — separate but mapped below |

---

## 1. Philosophy

Two ideas coexist deliberately:

1. **InsightHub (ui-2.0)** — current generation, premium light-SaaS editorial: warm gray `#eef0f1` app bg, white `26px` cards, hairline borders not shadows, oversized 400-weight KPI numerals, `orange → teal → white` rhythm, ambient radial glows, `useCountUp` roll not snap. `mcp-firewall/design.md:20`
2. **Liquid glass** — material layer. Translucency **only** for floating surfaces (sidebar, toasts, login card, chart tooltips). Content cards are opaque. Keeps glass special. `mcp-firewall/design.md:28`

Generation status:

| Generation | Pages |
|---|---|
| ui-2.0 (current) | Dashboard, Agents, AgentDetail, TestMCP (Connectors), ConnectorDetailPage, AuditLog, Settings |
| Gen-1 legacy (still themed) | Firewall, Policies, Profile, Login (intentional glass), modals |

---

## 2. Color System

### 2.1 Light theme (`:root` in `styles.css:3`)

| Token | Value | Use |
|---|---|---|
| `--bg-app` / `--bg-content` | `#eef0f1` | Page background |
| `--bg-surface` / `--bg-surface-elevated` | `#ffffff` | Cards, inputs, overlays |
| `--bg-surface-hover` | `rgba(17,17,17,.03)` | Row hover wash |
| `--bg-inset` | `#f2f3f4` | Segmented controls, toggles wells |
| `--border-default` | `rgba(17,17,17,.05)` | Hairlines inside cards |
| `--border-strong` | `rgba(17,17,17,.1)` | Table head rules, secondary buttons |
| `--text-primary` | `#111111` | Headings, values |
| `--text-secondary` | `#666666` | Body |
| `--text-muted` | `#999999` | Labels, captions, axis ticks |
| `--card-bg` | `#ffffff` | Card bg |
| `--card-border` | `rgba(17,17,17,.06)` | Card border |
| `--card-shadow` | `0 1px 2px rgba(16,24,32,.04)` | Subtle |
| `--chart-grid` | `#ecedee` | Chart grid |
| `--glass-bg` | `rgba(255,255,255,.65)` | Glass fill light |
| `--glass-border` | `rgba(255,255,255,.55)` | Glass border |

**Accents — fixed vocabulary across charts/badges/tables:**

| Token | Value | Meaning |
|---|---|---|
| `--accent-coral` | `#ff3144` | Deny/blocked, active nav, primary CTA, danger |
| `--accent-teal` | `#397e70` | Allow/protected/connected, success |
| `--accent-amber` | `#de911d` | Log/needs-auth, warning |

Decision colors: allow=teal, deny=coral, log=amber, neutral gray `#9aa1a9` for secondary series. `design.md:70`

### 2.2 Dark theme ("Dark 2.0") `styles.css:39`

Deep blue-black `#0a0d13` app, `#10151d` surfaces (cards `rgba(16,21,29,.88)`). Neon shift:

| Token | Light | Dark |
|---|---|---|
| `--bg-app` | `#eef0f1` | `#0a0d13` |
| `--bg-surface` | `#ffffff` | `#10151d` |
| `--accent-teal` | `#397e70` muted pine | `#2fe6b0` neon mint |
| `--accent-amber` | `#de911d` | `#ffb020` |
| `--accent-coral` | `#ff3144` | `#ff3144` |
| glow | — | `--glow-red: 0 0 26px rgba(255,49,68,.35)`, `--glow-teal: 0 0 26px rgba(47,230,176,.28)`, `--glow-amber` |

Dark conventions: card shadow `0 0 0 1px rgba(255,255,255,.02), 0 10px 36px rgba(0,0,0,.5)`, `.chart-card` border `rgba(0,0,0,.45)`, metric top-bar glow `color-mix(in srgb, var(--accent) 42%, transparent)`, pattern grid hairlines white-alpha, headings faint white text-shadow.

### 2.3 Gradient treatments

Filled KPI cards: `160deg` two-stop + soft hue shadow:

```css
.db-kpi-orange { background: linear-gradient(160deg, #ff5163, #ff3144); box-shadow: 0 14px 34px rgba(255,49,68,.28); }
.db-kpi-teal   { background: linear-gradient(160deg, #43907f, #397e70); box-shadow: 0 14px 34px rgba(57,126,112,.26); }
```

Dark deepens to `#ff4d5e→#e51f33`, `#17b28c→#0e8a6d` and swaps shadow for `var(--glow-*)`.

### 2.4 CTFENCE website tokens `app/globals.css:89`

Marketing site uses a darker inverted system but maps 1:1 on accent `#ff3144`:

* Dark `:root` — `--void #050507`, `--surface #0d0d12`, `--border #1e1e2e`, `--text #c4c4d4`, `--bright #e8e8f0`, `--accent #ff3144`
* Light `html[data-theme="light"]` — `--void #ffffff`, `--surface #f7f7fa`, `--border #e4e4ec`, `--text #2a2a38`
* Paper/ink tokens for printed editions: `--paper #14141a` dark / `#f6f3ea` light, `--ink` etc.
* Fonts site-wide: `Canela Deck` (display/body, 100-900) + `JetBrains Mono`/`Space Mono` (mono).

---

## 3. Theme Architecture

Three-state: `:root` light → `:root[data-theme="dark"]` manual → `@media(prefers-color-scheme: dark){ :root:not([data-theme]){…}}` OS. Applied by `lib/theme.ts` `applyTheme()` on `<html>`. `system` removes attribute. Body transitions `background-color/color 400ms ease`. **Every dark override written twice** — intentional duplication. `design.md:114`

CTFENCE site mirrors with `html[data-theme="light"]` vs `:root` dark + `prefers-color-scheme: light` fallback `app/globals.css:129`.

---

## 4. Liquid-Glass Material

Formula: translucent fill + `backdrop-filter: blur(20-30px) saturate(180%)` + white hairline + **inset specular top highlight** (`inset 0 1px 0 rgba(255,255,255,…)`) + deep drop. Specular edge makes it physical. `design.md:141`

**Sidebar** `Layout.tsx:156` flagship:

```css
position: fixed; inset-block: 16px; left: 16px; width:76px→244px;
background: var(--glass-bg); /* .65 light / .72 dark */
backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--card-border);
border-radius: 28px;
box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 10px 36px rgba(16,24,32,.1);
.expanded { box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 18px 56px rgba(16,24,32,.16); }
```

**Toast** `styles.css:685` `.cf-glass-toast`: `rgba(255,255,255,.72) blur28 saturate180 contrast100 border rgba(255,255,255,.8) inset 0 1px 1px rgba(255,255,255,.9), 0 20px 48px rgba(16,24,32,.16)` — dark `rgba(14,19,27,.72)` border white `.12`.

**Login card** `LoginPage.tsx` `.auth-card`: `rgba(255,255,255,.82) blur32` over animated ambient radial spots + 6 moving gradient orbs `blur52-55` inside `.auth-visual-canvas`.

**Legacy**: `.glass`, `.glass-panel` blur30, `.chart-tooltip` blur30 16px radius, modal scrim `rgba(0,0,0,.35-.5) blur4-6px`.

Allowed surfaces: sidebar 20px, toasts 28px, login 28px heavy fill, chart tooltip 30px, modal scrims 4-6px. Everything else opaque. Fallback `prefers-reduced-transparency: reduce` → opaque `var(--bg-surface)` no filter `Layout.tsx:178`.

---

## 5. Surfaces, Radii, Elevation

| Radius | Used by |
|---|---|
| `999px/9999px` | Buttons, nav links, badges, inputs, selects, chips |
| `26px` | ui-2.0 cards `.db-card` `.qc-card` `.ag2-card` |
| `24px` | `.glass-panel`, auth inner |
| `22px` | `.glass-card` `.stat-card` `.chart-card` |
| `20px` | `.data-table-card`, toast |
| `16px` | Textareas, tooltips |
| `12/11/10/8px` | Icon tiles, small buttons, range items |
| `28-32px` | Sidebar, auth card (hero) |

Light: hairlines not shadows. Dark: ring + deep lift. Base card `styles.css:524`:

```css
.card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 26px; padding: 28px; box-shadow: 0 1px 2px rgba(16,24,32,.04); }
```

Hairline discipline: `--border-default` 5% inside, `--border-strong` 10% structural, nothing >12% alpha.

---

## 6. Typography

Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`; mono `'SF Mono', Menlo, monospace` for tool names. Website: `Canela Deck` for display/body + `JetBrains Mono`/`Space Mono` for mono/code. `app/globals.css:1`

| Style | Spec |
|---|---|
| Page heading `.db-heading` | 24px / 650 / -0.02em |
| Card title `.db-h3` | 21px / 550 / -0.015em |
| KPI label (filled) | clamp(24px,2vw,29px) / 400 airy |
| KPI value | clamp(42px,4.2vw,52px) / 400 / -0.03em hero numeral |
| Legacy stat | 36px / 800 |
| Body/table | 13-15px / 500-600 |
| Micro label/th | 10-11px / 700 / uppercase / .06em |

Habits: sentence-case, muted subhead `.db-h3-sub` 12.5px below titles, `tabular-nums` on numbers, `-0.02em` tracking on large.

---

## 7. Layout Grammar (ui-2.0 anatomy) `design.md:278`

```
ambient-glow root (::before fixed radial gradients, pointer-events:none, z0)
 └ z1 content
    ├ slim header  h1 24/650 + muted subhead, quiet pill action right
    ├ status strip  live facts · pulse dot · stream state
    ├ toolbar  segmented controls / filters (optional)
    ├ KPI band  orange → teal → white → large-white rhythm
    ├ main split  2fr table + 1fr charts column
    └ footer bands  paired 2-col cards
```

* Dashboard KPI: `grid 1fr 1fr 1fr 2.2fr` min-h 480px, 2col ≤1180, 1col ≤720. `Dashboard.tsx:533`
* Bottom split: `2fr 1fr` collapses 1col ≤1180.
* Container max 1404px centered, `margin-left:104px` clears collapsed rail `Layout.tsx:322` (expanded overlays).
* Gaps 18px, card padding 28px consistently.

Ambient glow recipe:

```css
content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
background: radial-gradient(560px 420px at 10% 6%, rgba(255,49,68,.06), transparent 65%),
            radial-gradient(680px 500px at 90% 92%, rgba(57,126,112,.07), transparent 65%);
/* dark .14/.10 + amber blob at 70% 20% */
```

KPI rhythm is signature — repeat on Agents, AgentDetail, Connectors, ConnectorDetail. Exactly one orange, one teal, rest white per band.

---

## 8. Components

### Buttons

| Class | Look | Hover |
|---|---|---|
| `.btn-primary` / pill CTA | coral fill white 999px | scale1.02 translateY-1 + hue shadow |
| `.btn-secondary` | transparent 1px `--border-strong` | wash + micro-lift |
| `.btn-ghost` | card-bg quiet pill `.active`=coral | wash |
| Quiet utility `.db-refresh` | `--bg-inset` 38h 12.5px/650 | darker inset |
| Black pill `.db-pill` | `#111` white (dark `#f2f5f9`) | opacity .85 scale .97 |

Spring `300ms cubic-bezier(.34,1.56,.64,1)` overshoot, utility hovers 160ms ease.

### Segmented & chips

Inset track `--bg-inset` 3px pad 10px radius, items 8px radius; active coral white, inactive muted. `.qc-state` dot+tinted pill per state (on `#128a6d` teal, off amber, err coral).

### Badges

Pill 12px/600 accent-on-tint: `allow teal rgba(0,166,153,.15)`, `deny coral rgba(255,90,95,.15)`, `log amber rgba(252,180,0,.15)`. Protect on/off outlined 1px 30% alpha.

### Inputs

`.glass-input/-select/-textarea`: surface fill hairline 999px (textarea 16px), focus coral + `0 0 0 3px rgba(255,90,95,.15)`, custom SVG chevron, placeholder `--text-muted`.

### Tables

Legacy `.glass-table`/`.data-table` zebra via even-row wash. ui-2.0 editorial `.db-table`: 15px type, 15px row pad, 11px uppercase header, hairline fading last row. AuditLog Excel-style drag resize via pointer events on colgroup. `AuditLog.tsx:106`

### Sidebar `Layout.tsx`

Floating glass rail 76↔244px hover/pin. Collapsed centered circular chips; width `260ms [0.22,1,0.36,1]`, labels fade 180ms delay80. Active: coral text 8% wash, icon chip coral gradient `150deg #ff5163→#ff3144` + specular + shadow. Chip morphs size 42px collapsed vs 34px expanded. Avatar teal gradient `150deg #397e70→#2c6156`. Lenis `lerp0.08` smooth scroll, skipped reduced-motion.

### Toasts

Sonner `toast.custom` `.cf-glass-toast` bottom-right max4 gap10. 32px tinted icon tile per kind ~12% bg + 13px bold title +12px muted msg + close. `notify.{success,error,warn,info,loading,dismiss}` outside React.

### Tooltips

Static chart tooltips solid white (dark `#161c26`) 12px radius double shadow — not glass for legibility. `.chart-tooltip` glass variant for gen-1. `AnimatedTooltip` spring `±45°` tilt `±50px` drift `useSpring(useTransform(x))` stiffness260 damping10.

### Modals

Scrim `rgba(0,0,0,.35-.5) blur4-6px` + solid panel spring/scale.

---

## 9. Motion System

Shared variants identical every page `Dashboard.tsx:60`:

```tsx
containerVariants = { hidden:{}, visible:{ transition:{ staggerChildren:0.05 } } }
cardVariants = { hidden:{opacity:0,y:20,scale:.97}, visible:{opacity:1,y:0,scale:1, transition:{duration:.45,ease:[0.22,1,0.36,1]}} }
```

| Curve | Use |
|---|---|
| `[0.22,1,0.36,1]` | Entrances, width morphs — fast start long settle |
| `[0.34,1.56,0.64,1]` | Interactive overshoot buttons/nav |
| plain ease 160-250ms | Hovers, color changes |

Count-up `useCountUp(value,900)` rAF ease-out cubic. `formatNumber()` K/M compaction + tabular-nums. Charts: `animationBegin180 duration700 ease-out`, period switches keep mounted so curve morphs, `key` flips once empty→loaded, `yMax=max(4,ceil(max*1.2))` stable fn prevents flicker, Today starts at first hour with data.

Ambient: firewall shield breathes scale/glow loop, login orbs drift 12-18s, spinners 900ms linear. `prefers-reduced-motion` disables.

---

## 10. Charts (recharts)

* Palette allow teal, deny coral, log gray `#9aa1a9`, amber needs-auth, extras `#c4cad0`.
* Area fills vertical gradient 14-16%→0 at 95%, stroke 2-2.4px `monotone` `dot:false` `activeDot r4 stroke #fff`.
* Axes no ticks/lines 11px `#999999`, dashed `4 4` cursor.
* Doughnuts `inner54 outer74 padding3 stroke0` center label absolute, legend dot+name+tabular value.
* Tooltip custom component never default. Dark tooltips `#161c26` grids white 5%.

Specifics audited:
* Dashboard area `allow/deny/log` + doughnuts `Dashboard.tsx:358,426`
* Agents figures `Agents.tsx:321` editorial trio per agent
* TestMCP overview figures + stacked health bar + 5-axis radar `TestMCP.tsx:169` (Online/Coverage/Traffic/Bindings/Auth)
* Profile telemetry area + donut `Profile.tsx:699`

---

## 11. Icons

* **Phosphor** `@phosphor-icons/react` `weight="fill"` 18px sidebar `Layout.tsx:6`
* **Lucide** `lucide-react` stroke1.75-2.2 in-page 9-16px
* Brand logos `lib/agentLogos.ts` CDN map + fallback, suspended desaturated `.at-avatar-off`
* Connector icons `lib/connectorIcons.ts` 18px inside 40px tile

---

## 12. CSS Organization

`styles.css` owns tokens, `.glass*`, `.data-table[-card]`, buttons, badges, stat/chart cards, toasts, pattern-grid, focus rings, responsive tweaks. Tailwind v4 imported sparingly — system is hand-rolled custom props.

Page blocks namespaced:

| Prefix | Owner |
|---|---|
| `lyt-` | Layout shell |
| `db-` | Dashboard |
| `ag-` / `ag2-` | Agents / AgentDetail |
| `qc-`, `cx-`, `cdp-` | ConnectorCard, TestMCP, ConnectorDetail |
| `au-` | AuditLog |
| `fw-` | Firewall (hero 16:9) |
| `auth-` | LoginPage |
| `at-` | AnimatedTooltip |
| `cf-glass-toast` | Toasts |
| `mk-` | Marketplace |
| `set-` | Settings |
| `prof-` | Profile |
| `ad-` | AgentDetail charts |

Conventions: root+glow first, layout→components→tooltips/modals, dark overrides duplicated at end, why-comments on non-obvious.

---

## 13. Accessibility

* Focus `.focus-ring:focus-visible 0 0 0 3px rgba(255,90,95,.2)` inputs same ring
* `prefers-reduced-motion` Lenis off, `motion-safe:animate-none`
* `prefers-reduced-transparency` glass→opaque
* Contrast body `#666` on white AA, `#999` non-essential only, dark high-alpha white `.68` floor
* Interactive cards `role="button"` keyboard Enter/Space `ConnectorCard.tsx:74`

---

## 14. Page-Level Signatures Audited

**Dashboard** `Dashboard.tsx:293` — slim header + `db-kpis` orange→teal→white→2.2x `db-chartcard` area + `db-bottom` 2fr recent activity table (5 cols Tool/Server/Agent/Decision/When) + 1fr column donut status + traffic share pie. Tooltip `.db-tooltip` white 12px radius.

**Agents** `Agents.tsx:225` — slim header + banner reasoning inject (`sequential-thinking`) + KPI 3col + `ag2-grid` auto-fill 380px cards: 58px logo tile, name/desc, state pill (on/off), 4-col figure row (Sessions/Tokens/Models…), footer seen+View Info arrow slide. Hover `translateY-3px border rgba(255,49,68,.22)`.

**TestMCP (Connectors)** `TestMCP.tsx:125` — header + `cx-overview` 3col `1fr 300px 240px` figures (Calls today/Tools/Bindings) + health stacked bar + 230px radar. Grid auto-fill 360px `qc-card`.

**ConnectorCard** `ConnectorCard.tsx:67` — 26px card 24px pad top, 40px icon tile, name 16/650 + mono origin 11px, state pill, 3-col figure row (Tools/Calls/Bindings with AnimatedTooltip avatars stacked -5px overlap), OAuth button dark `#111`, footer Test/Sync + Manage arrow.

**AuditLog** `AuditLog.tsx:222` — slim header + export pill + 5col status strip (Audited/Blocked/Block Rate/Viewing/Stream live) + toolbar segmented `All/Allowed/Blocked/Logged` + env chip coral when on + tablecard `table-layout:fixed width:max-content` 7 cols (Time→Action Block button), resize handles `col-resize` coral line, badges `b-allow/deny/log` 11/700 with dots, ENV red pill.

**Firewall** `Firewall.tsx:358` — slim header + error banner + cinematic hero 16:9 `min420 max520 28px` `aspect 16/9` with grid bg + ambient glow + radar stage (220px waves scale1→2.5 opacity .4→0 + dashed orbit rotate24s + sweep conic) + center orb 92px frost blur glow + footer narrative pills. KPI 4col rhythm, threats list with expandable variants, donut, services matrix + marketplace CTA.

**Settings** `Settings.tsx:329` — header + ghost Download backup + 5col strip (Version/Backend/Proxy/Mode/DB) + Security rows (Log-only, Env block, Prompt defense, Schema, Payload) each 34px icon tile + switch 44x24 knob 20px `translateX20` coral/teal + banner `rgba(57,126,112,.08)` + Notifications/Retention + Appearance + Updates + Cloud Backup Firestore 4 collections.

**Login** `LoginPage.tsx:79` — full viewport `auth-root` with Pattern opacity .04 + ambient spots + `auth-frame 6.5vh/vw` → `auth-card flex 1100x680 28px blur32` split 46%/fluid: left brand 50px icon + 40px heading "Welcome back." + Google btn 52h + divider + offline Zap; right `auth-visual-canvas` with 6 orbs `280/260/320/220/240/250` anim 12-18s drift + glass overlay `blur14`. Light `#f7f8fb` vs dark `#050507`.

**Policies** `Policies.tsx:231` — header + Templates dropdown + Export/Import + New Policy coral pill + audit context banner + inline editable row with 4 inputs + 3 action pills + origin tags (Built-in/Modified yellow/Custom coral) + actions Restore/Pencil/Trash.

**Profile** `Profile.tsx:599` — header Upgrade/Add Nodes pills + KPI 3col + charts row 2fr area telemetry +1fr donut allocation + bottom 2col: left identity header 50px avatar + plan tag + form grid (First/Last/Email disabled/Company/Phone dial+number) + Save; right ledger table Date/Plan/Amount/Status/Receipt + jsPDF invoice generator red header `#ff3144`.

**Marketplace** `Marketplace.tsx:288` — header + KPI 3col (Servers/Installed/Installs k) + Featured auto-fill 340px accent `18` bg + search pill 40h + category pills (active `#111`/dark `#f2f5f9`) + grid cards: top 24px icon + badges New/Verified/Installed + identity + tags + stats stars/installs + CTA pill (Reinstall muted).

---

## 15. Checklist — New Page/Component

1. Root div prefix-X classes + `::before` ambient glow if full page
2. Copy `containerVariants`/`cardVariants` verbatim, wrap bands `motion.section`
3. Slim header 24/650 title + muted subhead + quiet pill action
4. Cards `var(--card-bg)` / `--card-border` / 26px / 28px pad
5. Colors only via tokens; decisions teal/coral/amber only
6. Numbers `useCountUp` + `formatNumber` + `tabular-nums`
7. Feedback via `notify.*` never alert/inline
8. Dark mode duplicate every override under both selectors
9. Floating wants glass? Use recipe §4 complete with specular + fallback
10. Why-comment on non-obvious code

---

*Last audited from `mcp-firewall` 2026-09-26. Keep this file in sync when dashboard tokens/pages change.*
