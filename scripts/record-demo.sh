#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/demo-output"
mkdir -p "$OUTPUT_DIR"

echo "VerifiedVakil recording checklist"
echo "1. Start the app with: npm run dev"
echo "2. Open the local URL in Chrome or Safari."
echo "3. Read DEMO_SCRIPT.md and follow the timestamps exactly."
echo "4. Use macOS screen recording with microphone enabled."
echo "5. Save the movie as: $OUTPUT_DIR/verifiedvakil-demo.mov"
echo "6. Keep the final cut below 04:00."
echo ""
echo "Optional voiceover cue file: $ROOT_DIR/demo-output/voiceover-cues.txt"
cp "$ROOT_DIR/DEMO_SCRIPT.md" "$OUTPUT_DIR/voiceover-cues.txt"
echo "Prepared recording cues in $OUTPUT_DIR/voiceover-cues.txt"