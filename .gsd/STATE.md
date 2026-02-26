# STATE.md — Project Memory

> **Last Updated**: 2026-02-26
> **Current Phase**: 7 (IN PROGRESS)
> **Session**: 5

## Current Position

- **Phase**: 7 - Production Hardening & Compliance
- **Task**: Cloud Infrastructure Migration & Legal Compliance
- **Status**: Database Migrated to Neon (PostgreSQL), Legal Disclaimers Active, Scraper Locked for Prod.

## Last Session Summary

- **Legal Compliance**: Full sweep of the 7-step compliance checklist from the Risk Assessment.
- **Asset Migration**: Champion icons transitioned to official Riot Games Data Dragon CDN.
- **Production Lock**: Scraping API and UI buttons are now strictly locked in production/Vercel environments to comply with TOS.
- **Data Privacy**: Scraper audited for PII; zero-tolerance policy confirmed for anonymized statistical data only.
- **Database Migration**: Successfully migrated from SQLite to **Neon (PostgreSQL)** in the Singapore region (ap-southeast-1).

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
