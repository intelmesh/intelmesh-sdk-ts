# @intelmesh/sdk — Development Guidelines

## Overview
Official Node.js client for the IntelMesh Risk Intelligence Engine API. Wraps REST endpoints with typed methods, cursor-based pagination, and structured errors. Zero runtime dependencies, uses native fetch (Node 20+).

## Code Conventions
- TypeScript strict mode, zero `any`
- JSDoc on ALL exported symbols
- Explicit return types on all functions
- `readonly` on interface properties where possible
- Max 50 lines per function, max complexity 10
- One responsibility per file

## Architecture
- `src/types.ts` — All API types (mirrors swagger definitions)
- `src/client/http.ts` — Base HTTP client (fetch wrapper, auth, JSON parsing)
- `src/client/errors.ts` — Typed error hierarchy with status code mapping
- `src/client/pagination.ts` — Async cursor iterator for paginated endpoints
- `src/client/intelmesh.ts` — Main IntelMesh class (facade)
- `src/resources/*.ts` — One file per API resource (events, rules, phases, etc.)
- `src/builders/*.ts` — Fluent builders for events and rules
- `src/generated/types.ts` — Auto-generated from swagger.json (do not edit)

## Testing
- Vitest, run with `npm test`
- Tests in `tests/` mirror `src/` structure
- No network calls in tests — mock fetch

## Commands
- `npm run build` — Build with tsup
- `npm run lint` — ESLint check
- `npm run test` — Vitest run
- `npm run generate` — Regenerate types from swagger.json
- `npm run typecheck` — tsc --noEmit

## Key Principle
This SDK has ZERO runtime dependencies. It uses native fetch, native URL, and native AbortController. The only dependencies are devDependencies for build, lint, and test tooling.
