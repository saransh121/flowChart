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

## 4. Mirrors and directories (each ~10 min, free, permanent backlinks)

| Site | What to do |
|---|---|
| [SourceForge](https://sourceforge.net/create/) | Create project, pick "GitHub import", upload the 4 binaries. They mirror releases and rank well on Google for "download X". |
| [itch.io](https://itch.io/game/new) | Classify as *Tool*, price $0 with optional tip. Upload binaries, add screenshots. Surprisingly good for indie tools. |
| [AlternativeTo](https://alternativeto.net/manage-item/new) | Add as alternative to XMind, Miro, Whimsical, Lucidchart, MindMeister. This is where people searching for "free offline mindmap" land. |
| [Softpedia](https://www.softpedia.com/user/submit.shtml) | Submit; they review and give a "100% clean" badge. |
| [Uptodown](https://en.uptodown.com/developers) | Developer account, upload the exe. |
| [Electron apps list](https://github.com/electron/apps) | PR adding `flowchart` with the logo; shows on electronjs.org/apps. |
| [awesome-electron](https://github.com/sindresorhus/awesome-electron), [awesome-mindmap lists] | PR one line each. |

## 5. Launch posts (copy-paste)

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

## 6. Keep the funnel working

- README: add the GIF, a "Install with winget / brew" block, and star history badge once you have stars.
- Landing page: add the GIF and a "Star on GitHub" button.
- Turn on GitHub Discussions for feedback; watch Issues daily the first week.
- Ship v0.1.1 within a week with whatever people complain about first. Momentum matters more than features.
