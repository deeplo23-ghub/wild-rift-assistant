# STATE.md — Project Memory

> **Last Updated**: 2026-02-26
> **Current Phase**: 7 (IN PROGRESS)
> **Session**: 5

## Current Position

- **Phase**: 7 - Production Hardening & Compliance
- **Task**: Cloud Infrastructure Migration & Legal Compliance
- **Status**: Database Migrated to Neon (PostgreSQL), Legal Disclaimers Active, Scraper Locked for Prod.

## Last Session Summary

- **Legal Risk Assessment**: Conducted deep research into Riot Games Fan Content Policy and Indonesian Cyber Law.
- **Compliance Patch**: Added mandatory legal disclaimers to UI footer and disabled database synchronization in production mode to comply with Vercel TOS.
- **Database Migration**: Successfully migrated from SQLite to **Neon (PostgreSQL)** in the Singapore region (ap-southeast-1).
- **Codebase Mapping (/map)**: Generated updated `ARCHITECTURE.md` and `STACK.md` mapping the system structure post-migration.
- **Workspace Cleanup**: Reorganized project files, moved internal logs/screenshots to `docs/internal`, and clean up `.gsd` phase hierarchy.

## In-Progress Work

- **GitHub Handover**: Preparing clean commit for initial push or project backup.
- **Post-Deploy Phase**: Migrating static champion icons to Riot's official Data Dragon URLs to fully satisfy Fan Content branding requirements.

## Blockers

None. Cloud infrastructure is verified and seeding is complete.

## Context Dump

### Decisions Made

- **Neon PostgreSQL**: Selected for its serverless nature and high compatibility with Vercel's free tier. Located in Singapore for optimal APAC latency.
- **Production Lock**: Decided to disable the `Sync DB` button in the UI for production environments. Scraping will be handled locally to protect Vercel account standing.
- **Legal Boilerplate**: Integrated a responsive legal footer to ensure the app meets Riot's "notice and attribution" requirements.

### Current Hypothesis

- The application is now "Vercel-ready" from a compliance and infrastructure perspective. Switching to Neon has improved database reliability and enables global access without local SQLite file dependencies.

## Next Steps

1. **GitHub Push**: Finalize remote repository and push code.
2. **Vercel Deploy**: Connect the repository to Vercel and set `DATABASE_URL`.
3. **Data Dragon Migration**: Update icon URL patterns to use official Riot assets.
