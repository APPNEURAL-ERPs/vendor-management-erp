# GrowthOS Planning Alignment

GrowthOS follows the APPNEURAL OS planning contract from `APPNEURAL Plannings/OSs`.

## Package

- Package: `@appneurox/growthos`
- Domain API namespace: `/v1/growth`
- Modes: standalone, platform
- Related systems: AnalyticsOS, BrandOS

## Required Contract

- Manifest: `manifest.json`
- Core package: `packages/core`
- API package: `packages/api`
- SDK package: `packages/sdk`
- CLI package: `packages/cli`
- UI package: `packages/ui`
- Workers package: `packages/workers`
- Commands: `commands`
- Events: `events`
- Workflows: `workflows`
- Agents: `agents`
- Policies: `policies`
- Integrations: `integrations`
- Database migrations and seeds: `database/migrations`, `database/seeds`

## Runtime Rule

Business logic should live in core package code. API services stay thin and call the core package. SDK, CLI, PlatformOS, CommandOS, AutomationOS, AIOS, SecurityOS, and AnalyticsOS integrate through manifest-declared APIs, commands, events, permissions, and workflows.
