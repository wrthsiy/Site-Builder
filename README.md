# Site Builder

Free-position scene editor (Roblox Studio style) that exports a single `site.html`.

Controls: drag from the palette onto the scene; drag to move; 8 handles to resize;
Shift+click or marquee to multi-select; arrows nudge 1px (Shift = 10px); Delete removes;
Ctrl/Cmd+C / V / D copy, paste, duplicate; Ctrl/Cmd+wheel zooms; Space+drag or middle-mouse pans.
Rotate with the circle above the selection (hold Shift to snap to 15°) or the inspector slider.
Video: paste a YouTube URL or bare ID (watch, youtu.be, embed, shorts). YouTube refuses embeds
without a referrer, so an exported site.html must be served over http(s) (e.g. GitHub Pages), not opened via file://.

Export: `objectHtml()` in `src/render.js` turns the single `objects[]` state into absolutely
positioned elements. The canvas injects it as-is; "Export HTML" wraps the same output in a
`position:relative` scene container and downloads it as `site.html` via Blob.
