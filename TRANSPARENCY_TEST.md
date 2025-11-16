# Transparency System Test Checklist

## ✅ Integration Points Verified

### 1. **Service Registration**
- [x] `synthesisLineageService.ts` created with all functions
- [x] `api/insights/explain.ts` router created
- [x] Router imported in `api/server.ts`
- [x] Router registered at `/api/insights` endpoint

### 2. **Hook Implementation**
- [x] `hooks/useExplanation.ts` created with caching
- [x] Fetches from `/api/insights/explain/recommendation/:id`
- [x] Fetches from `/api/insights/explain/synthesis/:id`
- [x] Handles loading and error states

### 3. **Component Integration**
- [x] `ExplanationModal.tsx` created with full UI
- [x] `TransparencyButton.tsx` created with 3 variants
- [x] `RecommendationsTab.tsx` updated with buttons on:
  - AI Intelligence Hub recommendations
  - Shadow work suggestions
  - Next steps suggestions

### 4. **Data Flow**
- [x] `insightGenerator.ts` calls `createInsightLineage()`
- [x] Lineage tracked for every generated insight
- [x] `generatedBy` and `confidenceScore` added to IntegratedInsight
- [x] Graceful error handling if tracking fails

### 5. **Type Safety**
- [x] `types.ts` extended with lineage fields
- [x] `ExplanationData` interface defined
- [x] All imports use `.ts` extensions

---

## 🧪 Manual Testing Steps

### User Flow:
1. **Generate an insight** via any wizard (e.g., 3-2-1, IFS)
2. **Navigate to Recommendations Tab**
3. **Find "Pending Insights" section**
4. **Look for "Why?" icons** next to recommendations
5. **Click a "Why?" icon** → Modal should open
6. **Modal shows:**
   - Practice name
   - Reasons (primary + secondary)
   - Contributing sources with confidence badges
   - Integration timing
   - Overall app confidence
   - Verification status

### API Testing:
```bash
# Test recommendation explanation
curl http://localhost:3001/api/insights/explain/recommendation/{recommendationId}

# Test verification
curl -X POST http://localhost:3001/api/insights/explain/verify \
  -H "Content-Type: application/json" \
  -d '{"recommendationId": "test-id"}'

# Test history
curl http://localhost:3001/api/insights/explain/history/{userId}
```

---

## 🔍 What to Watch For

### ✅ Working Correctly If:
- [ ] "Why?" buttons appear next to recommendations
- [ ] Clicking opens modal without errors
- [ ] Modal content loads and displays reasoning
- [ ] Confidence badges show (high/medium/low)
- [ ] Sources list shows contributing wizards
- [ ] Verification status appears at bottom
- [ ] No console errors in browser devtools

### ⚠️ Common Issues:

**Issue: "Why?" buttons don't appear**
- Check RecommendationsTab.tsx has TransparencyButton imported
- Verify recommendationId is being passed correctly

**Issue: Modal opens but shows error**
- Check `/api/insights/explain/` endpoints are registered in server.ts
- Verify synthesisLineageService is imported correctly
- Check browser console for fetch errors

**Issue: No explanation data**
- Verify lineage tracking is called in insightGenerator.ts
- Check that `createInsightLineage()` completes successfully
- Look for warnings in server logs

---

## 📊 Expected Behavior

### Before Transparency Feature:
- Users see recommendations with no explanation
- Users have no way to verify app reasoning
- "Black box" AI making suggestions

### After Transparency Feature:
- Users see "Why?" buttons on every recommendation
- Users can click to see complete reasoning chain
- Users can verify sources and confidence levels
- Users empowered to accept/challenge insights

---

## 🔧 Server Routes Added

```
POST /api/insights/explain/verify                      (Verify lineage)
GET  /api/insights/explain/recommendation/:id          (Single rec)
GET  /api/insights/explain/synthesis/:id               (Batch)
GET  /api/insights/explain/lineage/:id                 (Raw data)
GET  /api/insights/explain/history/:userId             (History)
```

All routes return JSON with:
- `success`: boolean
- `explanation` or `error`: data or error message
- Appropriate HTTP status codes

---

## 🎯 Success Criteria

- [x] Code compiles without errors
- [x] All imports resolve correctly
- [x] Lineage service has proper exports
- [x] API endpoints registered in server
- [x] Components render without breaking existing UI
- [x] Button click handlers properly wired
- [ ] **PENDING: End-to-end runtime test**

Run this after deployment to verify everything works!
