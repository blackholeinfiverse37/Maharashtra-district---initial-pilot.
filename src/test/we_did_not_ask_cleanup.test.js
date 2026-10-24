// The temporary "we did not ask" cleanup (src/config/backendTextCleanup.js): each form the backend sends loses only
// that wording; the rest of the sentence stays as sent. Sentences as the backend sent them live, 24 Oct 2026.
import { expect, test } from "vitest";
import { removeWeDidNotAsk } from "../config/backendTextCleanup";

test("a bracket that is only 'we did not ask'", () => {
  expect(removeWeDidNotAsk("Sell now, unless you can store (we did not ask)")).toBe("Sell now, unless you can store");
  expect(removeWeDidNotAsk("आता विका, साठवण करता येत नसेल तर (हे आम्ही विचारले नाही)")).toBe("आता विका, साठवण करता येत नसेल तर");
});

test("'we did not ask about your storage;' first in a bracket: the reason after it stays", () => {
  expect(removeWeDidNotAsk("Sell now (we did not ask about your storage; holding did not pay here in a typical year)")).toBe(
    "Sell now (holding did not pay here in a typical year)"
  );
  expect(
    removeWeDidNotAsk("अभी बेचें (आपके भंडारण के बारे में हमने नहीं पूछा; यहाँ सामान्य साल में रोककर रखना फ़ायदेमंद नहीं रहा)")
  ).toBe("अभी बेचें (यहाँ सामान्य साल में रोककर रखना फ़ायदेमंद नहीं रहा)");
  expect(
    removeWeDidNotAsk("आता विका (तुमच्या साठवणुकीबद्दल आम्ही विचारले नाही; इथे सामान्य वर्षी साठवणे फायदेशीर ठरले नाही)")
  ).toBe("आता विका (इथे सामान्य वर्षी साठवणे फायदेशीर ठरले नाही)");
});

test("a sentence without the wording is untouched", () => {
  expect(removeWeDidNotAsk("Sell at APMC Test")).toBe("Sell at APMC Test");
});
