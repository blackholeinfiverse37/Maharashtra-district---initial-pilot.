# ADR-T-GOV-F02: How the dashboard shows backend data it cannot trust

**Status:** Proposed (for the owner, Gauri Deshpande, to accept or change). **Date:** 2026-11-06.
**Scope:** the AIAIC District Intelligence Dashboard (this React repository) only. Evidence:
`docs/EVIDENCE_T-GOV-F02.md`.

## Context

The dashboard shows what the AIAIC backend sends, card by card. A review on 2026-11-05 found three kinds of problem:

1. **Crashes on bad data.** Feeding every field of live backend answers with wrong values (missing, null, the wrong
   type, NaN, very large numbers) found 262 card crashes and 11 map crashes. With no error boundary, one failing card
   blanked the whole page.
2. **Answers shown as more certain than they are.** Nine logic defects, among them: a fixed ±2% band shown as a range
   of better and weaker days; a price and a recommended mandi shown for an answer the backend abstained on; forecast
   days from the past shown as "this week"; English and Marathi giving opposite taluka advice; "none in or near" when
   nearby districts could not be checked.
3. **Text that is not the dashboard's to change.** The backend's own advice must not be translated or reworded here,
   and some of its wording (the storage sample's "ILLUSTRATIVE ONLY" note) is not meant for farmers.

## Decision

1. **Bad data is "no data", per card.** A field of the wrong type is read as absent: a list that is not a list is
   empty, text that is not text is none. The card then shows its normal "no data" state, never a crash.
2. **One error boundary per card** (`src/components/CardBoundary.jsx`). If a card still fails, only that card shows
   "This part could not be shown. The rest of the page still works." (English, Hindi, Marathi); new data gives it
   another try.
3. **Never more certain than the backend.**
   - A fixed band is shown as one price with the fixed-band line, with or without a sample calculation.
   - An abstained answer shows no price and no recommended mandi, only a "no advice here" warning.
   - Forecast days before today are dropped; with none left, the card says the forecast is out of date and when it
     was read.
   - With CGWB's taluka list held, it is the only taluka source, in every language.
   - When nearby districts cannot be checked, the warehouse card says so.
4. **The backend's words are shown as sent, never translated here.** The crop's weather answer is shown as the
   backend sends it. Where the dashboard needs words of its own, they are the dashboard's own strings, in English,
   Hindi and Marathi (`src/i18n/strings/`). The storage sample's "ILLUSTRATIVE ONLY" note is not shown; the dashboard's
   own line takes its place: "Please check with an agronomist before you rely on this."
5. **No place or crop names in the code.** Rules are general: district names are compared without case, dots, extra
   spaces or a part in brackets (WDRA's "Khandwa (East Nimar)" = AIAIC's "Khandwa").

## Alternatives considered

- **Validate the whole answer with a schema and reject it when anything is wrong.** Not chosen: one bad field would
  empty the whole page, where reading it as absent keeps every other card working.
- **One error boundary around the whole page.** Not chosen: one failing card would still hide all the others.
- **Translate or reword the backend's text in the dashboard.** Not chosen: the backend owns its advice; the dashboard
  only adds labels of its own.
- **A list of district name aliases.** Not chosen: it would put place names in the code. The bracket rule is general;
  names that differ in spelling (Narsimhapur / Narsinghpur, Agar-Malwa / Agar Malwa) stay unmatched and are listed as
  a known gap.

## Consequences

- The bad-field test (20,050 card changes and 1,430 map changes) is the check for decision 1; its result is in the
  evidence document.
- A card can now be empty or show "no advice here" where it used to show a number. This is intended: the number was
  not reliable.
- The dashboard's own lines must be kept in all three string files and in `docs/translations_for_review.csv`, and
  checked by a native speaker.
- The storage sample calculation and its wording need an agronomist's review before final deploy.
