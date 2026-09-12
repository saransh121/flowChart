# Launch kit

Everything below needs a human account, so it is copy-paste ready. Do them roughly in this order; each one links back to the GitHub release, which is the single source of truth for downloads.

## 0. Before posting anywhere (30 min)

- [ ] Record a 15-second GIF: type a prompt, watch nodes stream in, drag one, export. Put it at `docs/demo.gif` and embed it at the top of README (`![demo](docs/demo.gif)`) and the landing page. **A post without a GIF gets a fraction of the clicks.**
- [ ] Take 2 screenshots (a mind map, a flowchart) for stores that want stills.
- [ ] Pin the repo on your GitHub profile.

## 1. winget (Windows) — free, biggest reach for Windows CLI users

Manifests are ready in `packaging/winget/`. Submit with:

```bash
gh repo fork microsoft/winget-pkgs --clone=false
# then either the GUI at https://github.com/microsoft/winget-pkgs (Add file → upload the 3 yaml files under manifests/s/saransh121/flowChart/0.1.0/)
# or wingetcreate, which validates and opens the PR for you:
winget install wingetcreate
wingetcreate submit --token <github-pat> packaging/winget/manifests/s/saransh121/flowChart/0.1.0
```

A bot validates, a human merges in 1–3 days. After that: `winget install saransh121.flowChart`. For later versions: `wingetcreate update saransh121.flowChart -u <new exe url> -v <version> --submit`.

## 2. Homebrew (macOS) — personal tap, no review

```bash
gh repo create saransh121/homebrew-tap --public --clone
mkdir -p homebrew-tap/Casks && cp packaging/homebrew/flowchart.rb homebrew-tap/Casks/
cd homebrew-tap && git add . && git commit -m "flowchart 0.1.0" && git push
```

Users: `brew install --cask saransh121/tap/flowchart`. Add the line to README. (The official `homebrew-cask` repo requires 30+ stars / some popularity; apply there later.)

## 3. Linux

- **AppImageHub**: open an issue at https://github.com/AppImage/appimage.github.io using their template, link the `.AppImage`. Lists you on appimage.github.io.
- **Flathub**: highest quality Linux channel, but needs a flatpak manifest built on `org.electronjs.Electron2.BaseApp` and a review. Do this after v0.2 when things settle. Template: https://github.com/flathub/org.electronjs.Electron2.BaseApp
- **Snap**: `snapcraft` with electron-builder `linux.target: snap`. Optional.

## 4. Mirrors and directories (each ~10 min, free, all need your own account — no API/CLI exists for any of these, so they can't be automated)

Everything you need is pre-filled below — just paste.

**Common fields, same for all four sites:**
```
Name: flowChart
Tagline: Turn plain text into an editable mind map or flowchart, fully offline
Category: Productivity / Office / Diagramming
License: MIT (free, open source)
Homepage: https://saransh121.github.io/flowChart/
Repository: https://github.com/saransh121/flowChart
Logo: https://saransh121.github.io/flowChart/logo.svg
Screenshots: https://saransh121.github.io/flowChart/flowchart.png , https://saransh121.github.io/flowChart/MindMap.png
```
```
Description (long):
flowChart turns a plain-text description into an editable mind map or flowchart. Type "how a
support ticket gets resolved" or "things to consider when buying a laptop" and it picks the right
diagram type, then streams it onto the canvas as a small AI model (Qwen3-1.7B, running fully
offline via llama.cpp) generates it. No account, no internet needed after the one-time model
download, no data ever leaves your device. Every node is editable — rename, reshape, connect,
delete — and exports to PNG, PDF, PowerPoint, or Word. Free and open source under the MIT license.
```

Direct binary URLs and checksums (for sites that ask you to link or verify the file):
| File | URL | SHA-256 |
|---|---|---|
| Windows installer | https://github.com/saransh121/flowChart/releases/download/v0.1.0/flowChart-0.1.0-win-x64.exe | `699c4a6be8efc9d1f432c9ec8172c9c5135d202f0b9b3a8ded1a649fa6737d0a` |
| macOS (Apple Silicon) | https://github.com/saransh121/flowChart/releases/download/v0.1.0/flowChart-0.1.0-mac-arm64.dmg | `56c7f6394e42aed407861b6bc9b6a498f3e2a521ec6b7003d67a6090c35e569b` |
| Linux AppImage | https://github.com/saransh121/flowChart/releases/download/v0.1.0/flowChart-0.1.0-linux-x86_64.AppImage | `a20daa439358807e0b16874b8b4cffbb6fa1b9248f3e09ae234a3b8b7c9cf1ec` |
| Linux .deb | https://github.com/saransh121/flowChart/releases/download/v0.1.0/flowChart-0.1.0-linux-amd64.deb | `30553106c6d9f6f8b5f6f971eec8da8263674570bfbdea0573d27db50b11d988` |

### SourceForge
1. https://sourceforge.net/create/ → sign in/create account.
2. "Create a project" → name it `flowchart` (or `flowchart-ai` if taken) → pick **Import from GitHub** and point it at `saransh121/flowChart` — it pulls the README and description automatically.
3. Project → Files → **Add Folder** `releases/0.1.0`, upload the 4 binaries from the table above (drag-and-drop from your `models`... no — from wherever you saved the downloaded release files, or download them fresh from the URLs above first).
4. Set the Windows `.exe` as the "default download" for Windows visitors (SourceForge auto-detects OS and serves the right file).
5. Project Summary page: paste the tagline + long description above.

### itch.io
1. https://itch.io/game/new → sign in/create account.
2. Kind of project: **Tool**. Title: `flowChart`. Classification: leave as default (it still lists under Tools even though the field says "game").
3. Pricing: **$0**, tick "allow donations" if you want optional tips.
4. Uploads: add all 4 binaries from the table above; itch.io auto-detects the platform per file (mark Windows/mac/Linux checkboxes on each upload).
5. Cover image: use `docs/flowchart.png`. Description: paste the long description above; embed the video by pasting `https://saransh121.github.io/flowChart/demo.mp4` directly in the itch.io rich text editor (it embeds automatically).
6. Publish.

### AlternativeTo
1. https://alternativeto.net/manage-item/new → sign in/create account.
2. App name: `flowChart`. URL: the homepage above.
3. Under "Alternative to", search and add: **XMind**, **Miro**, **Whimsical**, **Lucidchart**, **MindMeister** — these are the exact tools people compare against when searching "free offline alternative to X".
4. Tags: `mindmap`, `flowchart`, `diagram`, `offline`, `ai`, `open-source`.
5. License: **Free, Open Source**. Platforms: Windows, Mac, Linux.
6. Description: paste the long description above. Add both screenshots.

### Softpedia
1. https://www.softpedia.com/user/submit.shtml → sign in/create account.
2. Category: **Office Tools → Diagram Software** (or Multimedia if that's unavailable).
3. Download URL: use the Windows `.exe` link from the table above (Softpedia mirrors it and scans for their "100% Clean" badge).
4. Fill name/tagline/description exactly as above; their review typically takes a few days.

### Uptodown
1. https://en.uptodown.com/developers → apply for a developer account (short form, manual approval — allow a few days before you can upload).
2. Once approved: new app → `flowChart` → upload the Windows `.exe`.
3. Description: paste the long description above; add both screenshots.

| [Electron apps list](https://github.com/electron/apps) | Gated: needs the repo to be **20+ days old** (created 2026-09-12, so from **2026-10-02**). Entry is pre-written in `packaging/electron-apps/flowchart.yml` — steps in `packaging/electron-apps/README.md`. |
| [awesome-electron](https://github.com/sindresorhus/awesome-electron) | Gated: needs **30+ days old** (from **2026-10-12**) **and 100+ GitHub stars**. Steps in `packaging/electron-apps/README.md`. |

## 5. AI-tool directories (each needs your own account/login)

| Site | Path | Notes |
|---|---|---|
| [There's An AI For That](https://theresanaiforthat.com/launch/) | Free only via their monthly X/Twitter submission thread; otherwise a paid $437 fast-track | Needs your X account |
| [Futurepedia](https://www.futurepedia.io/submit-tool) | Free submission form, editorial approval | Needs an account |
| [Toolify](https://www.toolify.ai/submit) | Free submission form, listed within 48h | Needs an account |

Copy-paste listing text for all three:
> **Name:** flowChart
> **Tagline:** Text in, editable mind map or flowchart out — runs fully offline.
> **Category:** Productivity / Diagramming
> **Description:** flowChart turns a plain-text description into an editable mind map or flowchart using a small AI model (Qwen3-1.7B) that runs entirely on your own machine — no account, no internet required after the one-time model download, no data ever leaves your device. Free and open source (MIT). Windows, macOS, Linux.
> **URL:** https://saransh121.github.io/flowChart/
> **Pricing:** Free

## 6. Google Search Console (2 minutes, speeds up Google indexing)

1. Go to https://search.google.com/search-console, sign in with any Google account.
2. Add property → URL prefix → `https://saransh121.github.io/flowChart/`.
3. Verify via the "HTML tag" method: it gives you a `<meta name="google-site-verification" ...>` tag — paste it into `docs/index.html`'s `<head>`, commit, push, then click Verify.
4. Once verified: Sitemaps → submit `sitemap.xml`.

## 7. Launch posts (copy-paste)

**Show HN** — https://news.ycombinator.com/submit (post Tue–Thu, 8–10am ET)

> Title: `Show HN: flowChart – text to mind map/flowchart with a 1.7B model, fully offline`
>
> I wanted a diagram tool that works on a plane and doesn't send my notes to anyone. flowChart runs Qwen3-1.7B through llama.cpp inside an Electron app: you type "how a support ticket gets resolved", it picks flowchart vs mind map, streams the JSON, and elkjs lays it out live on a React Flow canvas. Everything is editable and exports to PNG/PDF/PPTX/DOCX.
>
> The interesting part was getting a small model to emit valid structure: a GBNF grammar forces compact JSON, and stripping the trailing-newline rule the grammar generator adds took generation from 38s to 10s because the model was looping on newlines. Free-form Mermaid from the same model was 5/20 valid; grammar-constrained JSON is 20/20.
>
> Runs at ~15 tok/s on an 8 GB laptop with an integrated GPU (Vulkan). MIT, Windows/macOS/Linux. Optional BYO API key if you want a big model.

**Reddit** — r/LocalLLaMA (technical, mention the grammar trick), r/productivity, r/selfhosted, r/opensource, r/Windows, r/macapps, r/linux
> Title: `I built a free offline mind map / flowchart generator that runs a 1.7B model on your laptop`

**Product Hunt** — https://www.producthunt.com/posts/new (needs a hunter or your own account; schedule for 12:01am PT)
> Tagline: `Text in, editable diagram out. Runs offline on your laptop.`

**X / LinkedIn / Mastodon** — GIF + one line + link. Tag @reactflow (they retweet apps built on it) and @nodellama.

**Dev.to / Medium** — the "how I made a 1.7B model output valid diagrams" write-up. Evergreen search traffic.

## 8. Keep the funnel working

- README: add the GIF, a "Install with winget / brew" block, and star history badge once you have stars.
- Landing page: add the GIF and a "Star on GitHub" button.
- Turn on GitHub Discussions for feedback; watch Issues daily the first week.
- Ship v0.1.1 within a week with whatever people complain about first. Momentum matters more than features.
