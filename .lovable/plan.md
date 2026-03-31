
# Plan: Fix Tactical & Advanced Tab Not Loading Data

## Root Cause Analysis

The database contains **duplicate player records** for "K Klaudio":

| jersey | name | hidden | id |
|--------|------|--------|-----|
| 10 | K Klaudio | false | 77b2ac73... |
| 9 | K Klaudio | true | 7fc73eeb... |

Both `useSinglePlayerPassEvents` and `usePlayerAdvancedStats` hooks query for the player by name using `.single()`, which fails with a 406 error when multiple rows are returned (even if one is hidden).

**Error from network logs:**
```json
{
  "code": "PGRST116",
  "details": "The result contains 2 rows",
  "message": "Cannot coerce the result to a single JSON object"
}
```

The Overview tab works because it uses `useTeamWithPlayers` which already filters hidden players and matches by name from pre-filtered results.

---

## Technical Implementation

### 1. Update useSinglePlayerPassEvents Hook
**File: `src/hooks/usePlayerPassEvents.ts`**

Add a filter to exclude hidden players when querying by name:

**Current code (lines 228-234):**
```typescript
const { data: playerData } = await supabase
  .from('players')
  .select('id, name, jersey_number')
  .eq('team_id', team.id)
  .eq('name', decodedName)
  .single();
```

**Updated code:**
```typescript
const { data: playerData } = await supabase
  .from('players')
  .select('id, name, jersey_number')
  .eq('team_id', team.id)
  .eq('name', decodedName)
  .or('hidden.is.null,hidden.eq.false')
  .maybeSingle();
```

Key changes:
- Add `.or('hidden.is.null,hidden.eq.false')` to filter out hidden players
- Change `.single()` to `.maybeSingle()` for safer handling

### 2. Update usePlayerAdvancedStats Hook
**File: `src/hooks/usePlayerAdvancedStats.ts`**

Apply the same fix to the player query:

**Current code (lines 40-45):**
```typescript
const { data: playerData } = await supabase
  .from('players')
  .select('id, name, jersey_number')
  .eq('team_id', team.id)
  .eq('name', decodedName)
  .single();
```

**Updated code:**
```typescript
const { data: playerData } = await supabase
  .from('players')
  .select('id, name, jersey_number')
  .eq('team_id', team.id)
  .eq('name', decodedName)
  .or('hidden.is.null,hidden.eq.false')
  .maybeSingle();
```

---

## Data Cleanup Recommendation

While the code fix will resolve the immediate issue, consider cleaning up the duplicate player record in the database:

**The hidden duplicate:**
- id: `7fc73eeb-f47e-4557-ba6c-6d5280c6657e`
- name: K Klaudio
- jersey: 9
- hidden: true

This can be removed if there are no match events associated with it, or merged with the active record.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/usePlayerPassEvents.ts` | Add hidden filter + use maybeSingle() |
| `src/hooks/usePlayerAdvancedStats.ts` | Add hidden filter + use maybeSingle() |

---

## Expected Result

After implementation:
- The Tactical & Advanced tab will correctly load pass maps and heatmaps for K Klaudio
- The hook will select only the active (non-hidden) player record
- Other players with duplicate hidden records will also work correctly
