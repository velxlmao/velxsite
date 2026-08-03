# velx.site

A Windows 98–themed developer portfolio. Static site — plain HTML, CSS, and JavaScript, no build step.

## Structure

- `index.html` — desktop, windows, taskbar, and Start menu markup
- `style.css` — the Windows 98 look (beveled borders, title bars, taskbar)
- `script.js` — window dragging/focus, taskbar, Start menu, Explorer panel, clock
- `assets/icons/` — pixel-style SVG icons
- `assets/images/` — project screenshots

## Run locally

Any static file server works, e.g.:

```bash
python -m http.server 8080
```

Then open http://localhost:8080
