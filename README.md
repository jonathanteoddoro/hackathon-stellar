# Suisse Reimagined – Frontend

This is a Vite + React + TypeScript application styled with Tailwind CSS and shadcn/ui. It contains:
- A marketing landing page (Index) with feature sections
- A login page that routes to the visual Flow Builder
- A visual Flow Builder (Feature) with drag-and-drop nodes, zoom and curved connections

## Requirements

- Node.js 18+ (recommend using nvm)
- npm (bundled with Node)

Check your versions:
```bash
node -v
npm -v
```

## Getting Started (Local)

1) Clone the repository and enter the frontend folder
```bash
git clone <YOUR_GIT_URL>
cd hackathon-stellar/frontend/suisse-reimagined
```

2) Install dependencies
```bash
npm install
```

3) Start the dev server
```bash
npm run dev
```

Vite will print a local URL (typically http://localhost:5173). Open it in your browser.

## Project Structure

```
frontend/suisse-reimagined/
├─ src/
│  ├─ pages/
│  │  ├─ Index.tsx        # Landing
│  │  ├─ Login.tsx        # Auth (demo)
│  │  └─ Feature.tsx      # Visual Flow Builder
│  ├─ components/
│  │  ├─ FeatureHoverSection.tsx
│  │  └─ ui/*             # shadcn-ui primitives
│  ├─ main.tsx            # App bootstrap
│  └─ App.tsx             # Router and providers
├─ index.html
├─ tailwind.config.ts
└─ tsconfig*.json
```

## Development Notes

- Login demo: use `user@gmail.com` / `12345` and you will be redirected to `/feature`.
- Flow Builder supports:
  - Drag-and-drop nodes from the sidebar to the canvas
  - Smooth curved connections
  - Zoom (Ctrl + mouse wheel), and +/-/Reset controls
  - Node details modal with n8n-like Inputs/Outputs management

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build locally
```

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix UI)
- react-router-dom, @tanstack/react-query
- lucide-react icons

## Troubleshooting

- If the shadcn CLI suggests using Bun, ensure you have `npm` and a `package-lock.json`; remove any `bun.lockb` left-overs.
- If the port 5173 is busy, Vite will select another port and display it in the terminal.

## License

MIT
