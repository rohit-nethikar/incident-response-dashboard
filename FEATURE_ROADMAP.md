# Incident Response Dashboard: Feature Prioritization & Roadmap

**Generated**: August 17, 2026  
**Current State**: Solid foundation with mock mode working end-to-end; production integrations missing

---

## Executive Summary

The dashboard has a **production-ready architecture** with working mock mode, real-time WebSocket updates, and complete incident lifecycle management. However, it depends on real connectors to be useful in production.

**Critical Misconceptions in Initial Brief:**
- ❌ "WebSocket real-time updates (events emit but UI doesn't subscribe)" → **Actually FULLY IMPLEMENTED**
- ✅ "Runbook step editing UI (steps display but can't add/modify)" → Confirmed missing

---

## Current Implementation Status

| Capability | Status | Notes |
|---|---|---|
| Mock connectors (7 systems) | ✅ Complete | All 7 emit synthetic events |
| WebSocket real-time updates | ✅ Complete | Dashboard subscribed, React Query cache invalidation working |
| Incident lifecycle (status, acknowledge, assign) | ✅ Complete | All transitions validated |
| Runbook CRUD (create/update/list) | ⚠️ Partial | Creation/read/tag editing works; step editing read-only |
| Connector mode toggle (mock↔real) | ✅ Complete | UI in Settings, database-backed state |
| Incident creation from connectors | ✅ Complete | Automatic ingestion + scoring |
| Manual incident creation form | ❌ Missing | No POST endpoint; blocks manual testing |
| Connector health monitoring | ✅ Complete | UI shows health, errors propagated via WebSocket |
| Tests & CI/CD | ❌ Missing | One test file; no test script; no GitHub Actions |

---

## Priority Matrix & Recommendations

### PHASE 1: Enable Manual Testing & Runbook Editor (Weeks 1-2)
**Impact**: HIGH | Effort: MEDIUM | Dependencies: None

#### 1.1 Incident Creation Form (Effort: 2-3 days)
**Why First**: Unblocks testing before real connectors are ready

**MVP Scope**:
- POST endpoint: `POST /api/v1/incidents`
- UI form with: title, description, sourceSystem (nullable), severity, affectedResource (optional)
- Minimal validation: required title + description only
- Auto-calculate scoreFactors as empty array; businessImpact as defaults

**User Workflow**:
1. SRE navigates to Incidents page
2. Clicks "New incident" button
3. Fills form (preset sourceSystem to mock for testing)
4. Form creates incident, dashboard updates in real-time via WebSocket

**Implementation Checklist**:
- [ ] Add `createIncidentSchema` to shared schemas
- [ ] Add POST handler in `incidents.routes.ts` (calls `ingestEvent` with manual event)
- [ ] Add "New incident" button to dashboard page
- [ ] Test: Create incident manually, verify it appears in real-time

**Files to Modify**:
- `packages/shared/src/schemas/index.ts` (add schema)
- `apps/server/src/rest/incidents.routes.ts` (add POST handler)
- `apps/web/app/(dashboard)/page.tsx` (add form UI)
- `apps/web/lib/api/incidents.ts` (add createIncident function)

**Go-to-Production Checklist**:
- [ ] Audit log entry for INCIDENT_CREATED
- [ ] Permission check: `incident:create` (new permission)
- [ ] Input sanitization (title/description max length)
- [ ] Rate limiting: 1 incident/user/minute max?

---

#### 1.2 Runbook Step Editor (Effort: 5-7 days)
**Why High Priority**: Core feature gap; enables creating multi-step playbooks

**MVP Scope**:
- Step management UI: add/edit/delete steps in runbook detail page
- Inline editing (no modal) — steps as list with editable fields
- Link field optional (URL validation)
- No drag-to-reorder initially

**User Workflow**:
1. SRE navigates to runbook detail
2. Sees "Add step" button below existing steps
3. Adds step (title + description + optional link)
4. Edit existing steps: click step to expand, edit, save
5. Delete: confirm removal

**Implementation Checklist**:
- [ ] Update runbook detail page UI: inline step editor
- [ ] Add "Add step" button + form
- [ ] Add "Delete step" with confirmation
- [ ] Call PATCH endpoint with updated steps array
- [ ] Test: Create runbook with 1 step, add 2 more, delete middle one

**Files to Modify**:
- `apps/web/app/(dashboard)/runbooks/[id]/page.tsx` (add step editor UI)
- `apps/web/lib/api/runbooks.ts` (add updateRunbookSteps if not present)
- Backend already supports partial updates via `updateRunbookSchema.partial()`

**Go-to-Production Checklist**:
- [ ] Max steps limit (e.g., 50)
- [ ] Field length validation (title/description/link)
- [ ] Optimistic UI updates
- [ ] Audit log: step count changes in metadata

---

### PHASE 2: Build Real Connectors (Weeks 3-8)
**Impact**: CRITICAL | Effort: HIGH | Dependencies: GCP credentials, SDK learning

#### Context: Connector Architecture
Each connector implements `SourceConnector` interface:
```typescript
interface SourceConnector {
  poll(cursor: unknown): Promise<{ events: NormalizedEvent[]; nextCursor: unknown }>;
  healthCheck(): Promise<boolean>;
}
```

**Shared Implementation Pattern** (pseudo):
```typescript
async poll(cursor: unknown) {
  const fromTime = cursor ? new Date(cursor) : new Date(Date.now() - 15min);
  const events = await api.query({ filter: `severity>=ERROR AND timestamp>${fromTime}` });
  
  // Group by pattern/resource to avoid spam
  const grouped = groupBy(events, e => e.resource);
  const normalized = Object.values(grouped)
    .filter(group => group.length >= threshold) // volume threshold
    .map(toNormalizedEvent);
  
  return {
    events: normalized,
    nextCursor: new Date().toISOString()
  };
}
```

#### 2.1 Cloud Logging (Effort: 5-7 days) - START HERE
**Why First**: 
- Easiest to integrate (query-based, pagination simple)
- Highest event volume (best initial testing)
- Foundation for other GCP connectors

**MVP Scope**:
- Query logs: `severity>=ERROR` since last cursor
- Deduplicate by resource + error pattern (avoid spam)
- Emit if: >3 occurrences in window OR new pattern
- Cursor: last_polled timestamp

**Implementation Steps**:
1. Install: `npm install @google-cloud/logging`
2. Auth: Use env var `GCP_SERVICE_ACCOUNT_KEY_PATH` (read JSON file)
3. Query: `logging.getEntries({ filter: 'severity>=ERROR ...', pageSize: 100 })`
4. Transform: Group errors by resource, build NormalizedEvent
5. Test: Enable in Settings, verify events appear

**Files**:
- `apps/server/src/connectors/cloudLogging/index.ts`

**Go-to-Production**:
- [ ] Connection retry logic (backoff)
- [ ] Error categorization (auth vs. transient vs. data)
- [ ] Log sampling for high-volume streams
- [ ] Threshold tuning (when to emit)

---

#### 2.2 Cloud Monitoring (Effort: 5-7 days)
**Why Second**: Similar to Logging, critical for alerting

**MVP Scope**:
- Query alert policies: `state=FIRING OR FIRING_FOR_LONG`
- Uptime check results: failed checks
- Group by policy + resource
- Deduplicate via externalId (policy + timestamp)

**Implementation**:
- Install: `@google-cloud/monitoring`
- Query: `AlertPolicyService.listAlertPolicies()` + `fetchAlertPolicies({ filter: 'state=FIRING' })`
- Cursor: policy list hash to detect new policies

**Files**:
- `apps/server/src/connectors/cloudMonitoring/index.ts`

---

#### 2.3 Cloud Run (Effort: 4-6 days)
**Why Third**: Lower event volume, good for testing connector architecture

**MVP Scope**:
- Query services: `list --filter='status!=OK'`
- Emit: deployment failures, traffic errors
- Cursor: last execution timestamp per service

**Implementation**:
- Install: `@google-cloud/run`
- Query revisions + traffic splits
- Look for: unhealthy revisions, failed traffic splits

**Files**:
- `apps/server/src/connectors/cloudRun/index.ts`

---

#### 2.4-2.7: Cloud Functions, Data Fusion, BigQuery, Tableau Server
**Lower Priority** but follow same pattern:
- **Cloud Functions**: Query logs + deployment state
- **Data Fusion**: Pipeline failures + data quality issues
- **BigQuery**: Query failures + slowing jobs + quota warnings
- **Tableau Server**: Extract failures + slow queries + user quota warnings

**Effort per connector**: 3-5 days (smaller SDKs, simpler APIs)

---

### PHASE 3: Testing & CI/CD (Weeks 6-9, parallel with Phase 2)
**Impact**: HIGH | Effort: MEDIUM | Dependencies: None (can start immediately)

#### 3.1 Unit Tests (Effort: 5-7 days)
**Current State**: 1 test file, no test script

**MVP Scope**:
- Core services: `scoring.ts`, `incidentIngestion.ts`, `incidentLifecycle.ts`
- Connector interface: mock connector against real schema
- Routes: key endpoints (PATCH status, acknowledge)
- Target: 50% coverage (core paths only)

**Setup**:
```bash
npm install --save-dev jest @types/jest ts-jest
npx jest --init
```

**Files to Test** (priority order):
1. `apps/server/src/services/incidentIngestion.ts` (5-7 tests)
2. `apps/server/src/services/scoring.ts` (5-7 tests)
3. `apps/server/src/connectors/types.ts` + mock (3-5 tests)
4. `apps/server/src/rest/incidents.routes.ts` (10-15 tests)
5. `apps/server/src/services/incidentLifecycle.ts` (10-15 tests)

**Add to package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

#### 3.2 Integration Tests (Effort: 3-5 days)
**Scope**:
- End-to-end: connector → ingestion → WebSocket → UI
- Test: mock connector polling → incident created → cache invalidated
- Database: use test PostgreSQL container

---

#### 3.3 GitHub Actions CI/CD (Effort: 2-3 days)
**Pipeline**:
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm run db:migrate
      - uses: codecov/codecov-action@v3
```

**Files**:
- `.github/workflows/ci.yml`

---

## Effort & Timeline Summary

| Phase | Feature | Effort | Timeline | Dependencies |
|---|---|---|---|---|
| **1** | Incident creation form | 2-3d | Week 1 | None |
| **1** | Runbook step editor | 5-7d | Weeks 1-2 | None |
| **2** | Cloud Logging connector | 5-7d | Week 3-4 | GCP creds |
| **2** | Cloud Monitoring connector | 5-7d | Week 4-5 | GCP creds |
| **2** | Cloud Run connector | 4-6d | Week 5 | GCP creds |
| **2** | Remaining 4 connectors | 15-20d | Weeks 5-8 | Phase 2.1-2.3 patterns |
| **3** | Unit tests | 5-7d | Weeks 6-7 | None |
| **3** | Integration tests | 3-5d | Week 7-8 | Unit tests complete |
| **3** | GitHub Actions | 2-3d | Week 8-9 | None |
| | **TOTAL (MVP to Prod)** | **~50-70d** | **~9 weeks** | **Parallel ok** |

---

## Go-to-Production Checklist

### Before First Real Connector
- [ ] Runbook step editor complete
- [ ] Incident creation form tested manually
- [ ] Unit test suite at 40%+ coverage
- [ ] Error handling in connector base: auth, transient, data errors
- [ ] Logging: each connector poll cycle logs start/end/errors
- [ ] Health check: each connector tested in Settings UI
- [ ] GCP credentials: service account created with Logging.viewer + Monitoring.reader roles

### Before Full Prod Rollout
- [ ] All 3 priority connectors (Logging, Monitoring, Run) live
- [ ] CI/CD pipeline green
- [ ] 60%+ test coverage
- [ ] Performance: load test with 10K incidents, verify dashboard latency <2s
- [ ] Security review: auth, input validation, SQL injection prevention
- [ ] Runbook templates for common patterns (connection timeouts, quota exceeded, etc.)
- [ ] Documentation: how to enable each connector, troubleshoot auth errors
- [ ] Rollback plan: switch connector modes from Settings, test fail-safe to mock

---

## User Workflows: Before vs. After

### BEFORE (Current)
```
Admin setup → Dashboard shows mock incidents → Test with mock only
↓
Want to test with real data? → No option (manually trigger events?)
```

### AFTER Phase 1
```
Admin setup → Creates test incident manually → Tests lifecycle (ack, assign, status)
↓
Runbook team → Edits multi-step playbook → Tests runbook matching
```

### AFTER Phase 2 (Logging Live)
```
Admin setup → Enables Cloud Logging connector in Settings
↓
Dashboard shows real errors from Cloud Logging (live)
↓
SRE sees incident → Acknowledges → Assigns to team
↓
Runbook matches tags → SRE executes steps → Approves remediation
```

---

## Architecture Notes

### Connector Abstraction is Clean
- **Strength**: Mock and real connectors are interchangeable at poll() level
- **Strength**: No connector SDKs leak into services/routes
- **Next**: Consider connector factory pattern for multi-tenant (separate creds per org)

### Real-Time Updates are Complete
- WebSocket emitter is wired everywhere (ingestion, lifecycle, connector health)
- React Query cache invalidation working correctly
- No polling-based UI (good for scale)

### Scoring System is Ready
- Severity factors calculated on ingest
- Business impact passed through
- Ready for ML-based anomaly detection later

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| GCP SDK integration complexity | Start with Logging (simplest API); document patterns |
| Authentication credential rotation | Use service account with minimal scope; store key in secret manager |
| High event volume (Logging spam) | Implement volume thresholds + grouping; use log filters |
| WebSocket connection drops | Already has reconnect logic; verify in load test |
| Database performance at 10K+ incidents | Add index on `status+severity`; cursor pagination tested |
| Real connector health breaks dashboard | Health check per connector; mock fallback in Settings |

---

## Quick Wins (Low-Hanging Fruit)

If prioritizing differently:

1. **Add Jest + 10 unit tests** (1 day) → Build confidence
2. **Add GitHub Actions** (1 day) → Enable CI before adding features
3. **Implement incident creation form** (2-3 days) → Unblock manual testing
4. **Implement runbook steps editor** (5-7 days) → Complete core feature
5. **Start Cloud Logging** (5-7 days) → Get first real data flowing

---

## Files to Reference

**Architecture**:
- `apps/server/src/connectors/types.ts` — Interface all connectors must implement
- `apps/server/src/jobs/pollLoop.ts` — How connectors are polled
- `apps/server/src/services/incidentIngestion.ts` — Event → Incident transformation

**UI Patterns**:
- `apps/web/app/(dashboard)/settings/page.tsx` — How to add admin UI
- `apps/web/lib/ws/useIncidentSocket.ts` — How WebSocket updates work
- `apps/web/lib/api/queryKeys.ts` — React Query patterns

**Testing**:
- `apps/server/src/rest/incidents.routes.test.ts` — Existing test example

---

## Questions for Prioritization

1. **Quick ROI**: Do you want manual incident creation first (testing) or jump to Cloud Logging (real data)?
2. **Team capacity**: Can frontend + backend work in parallel on Phase 1 features?
3. **GCP setup**: Is service account auth already configured, or is that a blocker?
4. **Test coverage bar**: Do you require 70%+ coverage before prod, or 40%?
5. **Runbook complexity**: Multi-step only, or also templating (variables, branching)?

