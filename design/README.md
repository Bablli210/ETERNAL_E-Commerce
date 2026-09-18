# Design sources

The wireframes and design direction for the eternal storefront, exported from the
Design canvas at <https://claude.ai/artifact/JkqZZoedUC3jRjkKDMvy3i>.

- `canvas.json` — the canvas index: every artboard, its title and its frame.
- `artboards/*.dc.html` — one file per artboard. Each is the artboard's full source; they
  render inside the Design canvas runtime, not standalone.

Rows on the canvas, left to right (desktop board · mobile board · notes board):

| Row | Boards |
| --- | --- |
| Cover | `Main` — how to read the canvas, sitemap, conversion architecture, Shopify architecture |
| Global chrome | `Global-desktop`, `Global-mobile`, `Global-notes` |
| Home | `Home-desktop`, `Home-mobile`, `Home-notes` |
| Collection | `PLP-desktop`, `PLP-mobile`, `PLP-notes` |
| Product page | `PDP-desktop`, `PDP-mobile`, `PDP-notes` |
| Scent finder | `Finder-desktop`, `Finder-mobile`, `Finder-notes` |
| Tales and the house | `Tale-desktop`, `House-desktop`, `Tale-mobile`, `Tale-notes` |
| Cart drawer | `Cart-desktop`, `Cart-mobile`, `Cart-notes` |
| Design direction | `Direction`, `Applied-desktop`, `Applied-mobile`, `Direction-notes` |
| Components and content | `Components`, `Content-plan`, `Kit-notes` |
| Motion | `Motion-map`, `Motion-spec` |

The storefront in the repository root implements these boards. When a board changes,
re-export it here so the code and the design stay in one place.
