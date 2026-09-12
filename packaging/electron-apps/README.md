# Submitting flowChart to app directories

## electron/apps
Wait until **2026-10-02** (20 days after the repo was created on 2026-09-12), then:

```bash
gh repo fork electron/apps --clone
cd apps
mkdir apps/flowchart
cp ../packaging/electron-apps/flowchart.yml apps/flowchart/flowchart.yml
cp ../build/icon.png apps/flowchart/flowchart-icon.png   # must be >= 256x256 PNG, square
git checkout -b add-flowchart
git add apps/flowchart && git commit -m "Add flowChart"
git push -u origin add-flowchart
gh pr create --repo electron/apps --title "Add flowChart" \
  --body "https://github.com/saransh121/flowChart - offline text-to-diagram app built on Electron."
```

## sindresorhus/awesome-electron
Wait until **2026-10-12** (30 days) **and** until the repo has 100+ stars — both conditions
are explicit in their contributing guide, and PRs that skip either get closed.
Once both are true:

```bash
gh repo fork sindresorhus/awesome-electron --clone
cd awesome-electron
# add one line under the "Productivity" section, alphabetical order:
# [flowChart](https://github.com/saransh121/flowChart) - Turns text into an editable mind map or flowchart, offline.
git checkout -b add-flowchart
git add readme.md && git commit -m "Add flowChart"
git push -u origin add-flowchart
gh pr create --repo sindresorhus/awesome-electron --title "Add flowChart"
```
