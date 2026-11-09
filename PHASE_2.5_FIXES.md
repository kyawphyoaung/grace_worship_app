# Phase 2.5 — Smoke Test Findings (to fix)

1. "Mark chapter as read" button — should appear BOTH below pickers AND at the bottom of the page (sticky footer or repeated). User scrolls long chapter, needs access at bottom.

2. Couple pill popup (top bar, "Ru Ky" + 2 avatars + heart) — opens off-screen on mobile. Popup rectangle is going past the right edge of viewport.

3. Bible language toggle (Both/MM/EN 3 buttons) — takes too much vertical space. Want a compact language icon button. Tap → expands to show Both/MM/EN options with animation. Select → collapses back to icon, showing current language.

4. Place "Mark chapter as read" button NEXT TO the language icon (same horizontal row) to save vertical height.

5. Display name — remove any "kyawphyoaung.me" or email-based name. My account display name should be "Harry". Tabs (Read, Search, Streaks) should show Harry with a profile vector icon next to it.

6. Streaks + calendar — should aggregate and display chapters read (not just session count).

7. Favorites — show as cards with the favorited verse text snippet. Tap card → navigate to full chapter view.

8. Add Chin (Zomi / Tedim Chin) language to Bible reader. Remove "Both" option. Replace with single language selector: MM / EN / Chin. User picks one, whole reader renders in that language. Need Chin bible data seed.

9. "Together for" card:
   - Two hearts are BOTH green — invisible against each other. Use two distinct colors (green + red).
   - After the number, add small "days" label. "Together for 25 days" not "Together for 25".
   - Add "since 14th Oct 2026" below (confirm year — earlier spec said 2026).
   - Add monthsary + anniversary count display below (how many monthsaries/anniversaries passed).
   - Beautify the whole card.