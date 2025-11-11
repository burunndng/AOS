# Serverless Functions Audit Report
**Generated:** 2024
**Status:** URGENT - Vercel Hobby Tier Optimization (12 Function Limit)

---

## Executive Summary
- **Total Current Endpoints:** 18 functions
- **Vercel Hobby Limit:** 12 functions
- **Over Limit By:** 6 functions
- **Recommendation:** Disable 6 non-critical functions to comply with tier limits

---

## Detailed Endpoint Inventory

### 🔴 CRITICAL - Core Features (KEEP)

#### 1. **POST /api/recommendations/personalized**
- **File:** `api/recommendations/personalized.ts`
- **Purpose:** Generates context-aware practice recommendations for users
- **Criticality:** CRITICAL - Core feature for personalized practice suggestions
- **Usage:** Called frequently after user assessment completion
- **Status:** KEEP ✓

#### 2. **POST /api/insights/generate**
- **File:** `api/insights/generate.ts`
- **Purpose:** Generates personalized insights from user sessions
- **Criticality:** CRITICAL - Core insight generation after sessions
- **Usage:** Called after each session completion
- **Status:** KEEP ✓

#### 3. **POST /api/practices/personalize**
- **File:** `api/practices/personalize.ts`
- **Purpose:** Personalizes practice instructions based on user context
- **Criticality:** CRITICAL - Core practice customization feature
- **Usage:** Called when user starts a practice
- **Status:** KEEP ✓

#### 4. **POST /api/user/sync**
- **File:** `api/user/sync.ts`
- **Purpose:** Syncs user session data with backend, indexes in Pinecone
- **Criticality:** CRITICAL - Core data persistence and RAG indexing
- **Usage:** Called after every session completion
- **Status:** KEEP ✓

#### 5. **DELETE /api/user/delete-data**
- **File:** `api/user/sync.ts`
- **Purpose:** User data deletion for privacy compliance (GDPR/etc)
- **Criticality:** CRITICAL - Legal/compliance requirement
- **Usage:** Called on user request for data deletion
- **Status:** KEEP ✓

#### 6. **GET /api/health**
- **File:** `api/server.ts` (line 454)
- **Purpose:** Health check for all services
- **Criticality:** CRITICAL - Operational monitoring and status verification
- **Usage:** Called by monitoring systems, deployment health checks
- **Status:** KEEP ✓

---

### 🟡 MODERATE - Important but Specialized (CANDIDATES FOR REMOVAL)

#### 7. **GET /api/practices/customizations**
- **File:** `api/practices/personalize.ts`
- **Purpose:** Get suggested customizations for a practice
- **Criticality:** MODERATE - Utility endpoint, functionality overlaps with #3
- **Usage:** Occasionally used when user wants suggestions before personalizing
- **Status:** **CANDIDATE** - Can be merged into personalize endpoint or removed
- **Impact:** Low - frontend can query practice context directly

#### 8. **POST /api/practices/save-custom**
- **File:** `api/practices/personalize.ts`
- **Purpose:** Save customized practice steps
- **Criticality:** MODERATE - Storage for custom practices
- **Usage:** Called after user modifies practice
- **Status:** **CANDIDATE** - Could be handled by user sync endpoint
- **Impact:** Medium - Requires data model change

#### 9. **GET /api/user/status**
- **File:** `api/user/sync.ts`
- **Purpose:** Get user sync status
- **Criticality:** LOW - Informational/diagnostic only
- **Usage:** Rarely used, mainly for debugging
- **Status:** **CANDIDATE** - Pure utility endpoint
- **Impact:** Low - Status can be queried from health endpoint or client state

#### 10. **POST /api/user/sync-batch**
- **File:** `api/user/sync.ts`
- **Purpose:** Batch sync multiple sessions for a user
- **Criticality:** MODERATE - Optimization for bulk operations
- **Usage:** Occasionally used for importing multiple sessions
- **Status:** **CANDIDATE** - Functionality exists in single sync endpoint
- **Impact:** Medium - Requires frontend loop instead of batch

---

### 🟠 EXPERIMENTAL - Specialized Features (CANDIDATES FOR REMOVAL)

#### 11. **POST /api/insights/patterns**
- **File:** `api/insights/generate.ts`
- **Purpose:** Generate pattern insights over time windows
- **Criticality:** LOW - Experimental/advanced analytics
- **Usage:** Rarely used, advanced feature
- **Status:** **CANDIDATE** - Experimental feature, could be replaced with cloud functions later
- **Impact:** Low - Provides insights but not core feature

#### 12. **POST /api/recommendations/assessment**
- **File:** `api/recommendations/personalized.ts`
- **Purpose:** Generate assessment-specific recommendations
- **Criticality:** MODERATE - Used after assessment completion
- **Usage:** Called when user completes assessment
- **Status:** **CANDIDATE** - Functionality partially overlaps with POST /personalized
- **Impact:** Medium - Assessment flow needs alternative approach

#### 13. **POST /api/shadow/memory-reconsolidation/extract-beliefs**
- **File:** `api/shadow/memory-reconsolidation.ts`
- **Purpose:** Extract implicit beliefs from memory narrative
- **Criticality:** LOW - Specialized shadow work feature
- **Usage:** Used in Memory Reconsolidation wizard (experimental)
- **Status:** **CANDIDATE** - Experimental/specialized feature
- **Impact:** Low - Affects only shadow work domain

#### 14. **POST /api/shadow/memory-reconsolidation/mine-contradictions**
- **File:** `api/shadow/memory-reconsolidation.ts`
- **Purpose:** Mine contradictions from beliefs
- **Criticality:** LOW - Specialized shadow work feature
- **Usage:** Advanced feature, rarely used
- **Status:** **CANDIDATE** - Experimental/specialized feature
- **Impact:** Low - Affects only shadow work domain

#### 15. **POST /api/shadow/memory-reconsolidation/complete**
- **File:** `api/shadow/memory-reconsolidation.ts`
- **Purpose:** Complete shadow work session
- **Criticality:** LOW - Session completion acknowledgement
- **Usage:** Advanced feature, rarely used
- **Status:** **CANDIDATE** - Could be handled as session data via sync
- **Impact:** Low - Affects only shadow work domain

#### 16. **POST /api/mind/eight-zones/enhance-zone**
- **File:** `api/mind/eight-zones.ts`
- **Purpose:** Enhance zone analysis for integral knowing framework
- **Criticality:** LOW - Specialized integral theory feature
- **Usage:** Advanced feature, rarely used
- **Status:** **CANDIDATE** - Experimental/specialized feature
- **Impact:** Low - Affects only mind/integral domain

#### 17. **POST /api/mind/eight-zones/synthesize**
- **File:** `api/mind/eight-zones.ts`
- **Purpose:** Synthesize 8 zones of knowing
- **Criticality:** LOW - Specialized integral theory feature
- **Usage:** Advanced feature, rarely used
- **Status:** **CANDIDATE** - Experimental/specialized feature
- **Impact:** Low - Affects only mind/integral domain

#### 18. **POST /api/mind/eight-zones/submit**
- **File:** `api/mind/eight-zones.ts`
- **Purpose:** Submit session completion for mind framework
- **Criticality:** LOW - Session completion acknowledgement
- **Usage:** Advanced feature, rarely used
- **Status:** **CANDIDATE** - Could be handled as session data via sync
- **Impact:** Low - Affects only mind/integral domain

---

## Recommendation: Functions to Deactivate

### **Option 1: RECOMMENDED - Minimal Impact**
Remove **6 functions** to get under 12-function limit:

1. ❌ **POST /api/user/sync-batch** - Batch functionality can be done client-side with single sync endpoint
2. ❌ **GET /api/user/status** - Purely informational, no critical functionality
3. ❌ **POST /api/practices/customizations** - Can query practice context separately
4. ❌ **POST /api/shadow/memory-reconsolidation/extract-beliefs** - Specialized feature
5. ❌ **POST /api/shadow/memory-reconsolidation/mine-contradictions** - Specialized feature
6. ❌ **POST /api/shadow/memory-reconsolidation/complete** - Can be handled via user sync

**Remaining: 12 functions**
- ✓ POST /api/recommendations/personalized
- ✓ POST /api/recommendations/assessment
- ✓ POST /api/insights/generate
- ✓ POST /api/insights/patterns
- ✓ POST /api/practices/personalize
- ✓ POST /api/practices/save-custom
- ✓ POST /api/user/sync
- ✓ DELETE /api/user/delete-data
- ✓ POST /api/mind/eight-zones/enhance-zone
- ✓ POST /api/mind/eight-zones/synthesize
- ✓ POST /api/mind/eight-zones/submit
- ✓ GET /api/health

---

### **Option 2: Aggressive Optimization** (if additional reduction needed)
Remove all 6 from Option 1 PLUS:
- ❌ **POST /api/insights/patterns** - Experimental analytics
- ❌ **POST /api/mind/eight-zones/enhance-zone** - Specialized feature
- ❌ **POST /api/mind/eight-zones/synthesize** - Specialized feature  
- ❌ **POST /api/mind/eight-zones/submit** - Specialized feature

This would reduce to **8 functions** (well under limit) but removes all integral/mind domain features.

---

## Implementation Steps

1. **Identify which endpoints your frontend actively uses** via analytics
2. **Choose Option 1 or Option 2** based on feature priorities
3. **Comment out or remove** selected endpoint routes from `api/server.ts`
4. **Remove or archive** corresponding implementation files
5. **Test remaining endpoints** for any cascading dependencies
6. **Redeploy** to Vercel

---

## Notes

- The RAG utility module (`api/rag/generate-prompt.ts`) is **not a function itself** - it's imported by other endpoints, so it doesn't count toward the 12-function limit
- Health check endpoint is essential for monitoring and should be kept
- Core recommendation, insight, and practice personalization features should be prioritized as they're core to the product
- Shadow work (memory-reconsolidation) and mind/8-zones features are specialized and less frequently used
