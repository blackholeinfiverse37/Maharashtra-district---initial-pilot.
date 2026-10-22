// The states the dashboard offers. No names are typed in components: each state's name comes from the string files
// through its `nameKey`.
//
// code     what is sent to the backend as `state`
// served   how the backend's /catalog lists the state in `states.served`
// nameKey  the key of the state's name in src/i18n/strings/*.js
//
// At start the app reads /catalog: only the states it serves are offered, and a served state missing here is offered
// too (sent as its served name, which the backend accepts). If /catalog cannot be read, this list is used as it is.
export const STATES = [
  { code: "maharashtra", served: "maharashtra", nameKey: "state.maharashtra" },
  { code: "mp", served: "madhya pradesh", nameKey: "state.madhya_pradesh" },
];

export const DEFAULT_STATE = "maharashtra";

// The offered states, given the backend's served list (or null when it could not be read)
export function statesFromServed(served) {
  if (!Array.isArray(served) || served.length === 0) return STATES;
  const known = STATES.filter((s) => served.includes(s.served));
  const extra = served
    .filter((name) => typeof name === "string" && !STATES.some((s) => s.served === name))
    .map((name) => ({ code: name, served: name, nameKey: `state.${name.replace(/\s+/g, "_")}`, fallbackName: name }));
  const all = [...known, ...extra];
  return all.length ? all : STATES;
}
