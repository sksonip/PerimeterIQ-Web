# PerimeterIQ Web

A companion web-interface prototype for PerimeterIQ operations, including manager/admin views, assignment planning, and compliance summaries.

**Status: prototype using local demo state.** This repository does not establish a shared production backend or verified synchronization with the [Android application](https://github.com/sksonip/PerimeterIQ).

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Use the local address printed by the development server.

```sh
npm run lint
npm run build
```

The project uses React, TypeScript, vinext, and Vite. Build/start scripts are defined in [package.json](package.json).

## Key files

- `components/perimeter-portal.tsx`: operations interface.
- `lib/perimeter-data.ts`: domain types, demo-state generation, and KPI calculations.
- `app/`: page entry point and global styles.

Live/demo labels in sample data are interface scenarios; they do not prove connectivity to real devices or a production service. Build checks do not establish production readiness.

Maintained by [Satish Kumar Soni](https://github.com/sksonip).
