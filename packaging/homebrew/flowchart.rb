# Homebrew cask for a personal tap: put this file at Casks/flowchart.rb in a repo named homebrew-tap,
# then users run:  brew install --cask saransh121/tap/flowchart
cask "flowchart" do
  version "0.1.0"
  sha256 "56c7f6394e42aed407861b6bc9b6a498f3e2a521ec6b7003d67a6090c35e569b"

  url "https://github.com/saransh121/flowChart/releases/download/v#{version}/flowChart-#{version}-mac-arm64.dmg"
  name "flowChart"
  desc "Turn plain text into editable mind maps and flowcharts with an AI model that runs fully offline"
  homepage "https://github.com/saransh121/flowChart"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on arch: :arm64

  app "flowChart.app"

  zap trash: [
    "~/Library/Application Support/flowChart",
    "~/Library/Preferences/com.saransh.flowchart.plist",
  ]
end
