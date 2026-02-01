
# Plan: Dynamic Player Grid Repositioning on Substitution

## Overview
Currently, when substitutions occur, the player selector grids only apply visual styling (disabled/green) to players in their original positions. This update will dynamically reposition players between the "Starting XI" and "Subs" sections based on logged substitution events, creating a more intuitive match-day representation.

## Current Behavior
- Players subbed OFF: Shown disabled/grayed in Starting XI section
- Players subbed ON: Shown highlighted green in Subs section

## New Behavior
- Players subbed OFF: Move to Subs section and appear disabled
- Players subbed ON: Move to Starting XI section and appear active

---

## Technical Implementation

### 1. Update PlayerSelector Component
**File: `src/components/match-events/PlayerSelector.tsx`**

Modify the player splitting logic to dynamically reassign players based on substitution events:

```text
Current Logic (lines 38-45):
- Filters by original `status` property only

New Logic:
- Compute "effective starters" = original starters (minus subbed off) + subbed on players
- Compute "effective subs" = original subs (minus subbed on) + subbed off players
- Sort each group by jersey number
- Subbed OFF players in subs section remain disabled
- Subbed ON players in starters section appear active (not highlighted green)
```

Key changes:
- Replace static `starters` and `substitutes` arrays with computed `effectiveStarters` and `effectiveSubs`
- Players who were subbed ON join the starters list (active, normal styling)
- Players who were subbed OFF move to subs list (disabled, grayed out)

### 2. Update EventModifiers Component
**File: `src/components/match-events/EventModifiers.tsx`**

Apply the same dynamic repositioning logic to the target player selection grid:

- Compute `effectiveStarters` and `effectiveSubs` using the same algorithm
- Subbed ON players appear in Starting XI grid (selectable)
- Subbed OFF players appear in Subs grid (disabled)

### 3. Update Dropdown Menus
Both components have "All players" dropdowns that should also reflect the new status:

- Show badge indicating current effective role
- Consider showing "(ON)" or "(OFF)" indicators for recently substituted players

---

## Visual Summary

**Before Substitution:**
```text
Starting XI:  [1] [4] [7] [10] [14] [15] [16] [19] [26] [73] [99]
Subs:         [3] [5] [11] [12] [18] [22] [23] [25] [27]
```

**After #99 is subbed OFF, #27 comes ON:**
```text
Starting XI:  [1] [4] [7] [10] [14] [15] [16] [19] [26] [27] [73]
Subs:         [3] [5] [11] [12] [18] [22] [23] [25] [99-disabled]
```

---

## Edge Cases Handled

1. **Multiple substitutions**: Track all substitution events, not just the last one
2. **Substitute gets substituted**: If #27 comes on and later goes off for #23, #27 moves back to subs (disabled), #23 moves to starters
3. **Sorting**: Both sections remain sorted by jersey number after repositioning

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/match-events/PlayerSelector.tsx` | Add dynamic player repositioning logic based on substitution state |
| `src/components/match-events/EventModifiers.tsx` | Apply same repositioning logic to target player grid |

---

## Testing Recommendations

After implementation, verify the following scenarios:
1. Log a substitution event and confirm the players swap sections
2. Verify the subbed OFF player appears disabled in the Subs section
3. Verify the subbed ON player is selectable in the Starting XI section
4. Test multiple consecutive substitutions
5. Check that dropdowns reflect the updated player statuses
