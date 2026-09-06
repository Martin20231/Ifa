#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "XcodeGen fehlt. Installieren mit: brew install xcodegen"
  echo "Oder folge der manuellen Xcode-Anleitung in README.md"
  exit 1
fi

xcodegen generate
echo "Fertig: IFATagebuch.xcodeproj erzeugt."
open IFATagebuch.xcodeproj
