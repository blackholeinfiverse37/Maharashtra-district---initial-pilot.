// The Top 5 mandis card: the list of the top 5, and up to 5 more behind "Show more".
// Made-up mandis only.
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TopMandisPanel from "../components/TopMandisPanel";

afterEach(cleanup);

const market = (n) => ({
  market: [
    {
      supporting_evidence: {
        options: Array.from({ length: n }, (_, i) => ({
          mandi: `APMC Test ${i + 1}`,
          district: "Testland",
          gross_price: 10000 - i * 100,
          price_day: "2026-10-23",
          km: 10,
          is_local: false,
        })),
      },
    },
  ],
});
const names = (container) => [...container.querySelectorAll(".mandi-name")].map((p) => p.textContent);

test("12 mandis: 5 shown, 'Show more' adds the next 5 (never more than 10), 'Show fewer' goes back", () => {
  const { container } = render(<TopMandisPanel data={market(12)} />);
  expect(names(container)).toEqual(["APMC Test 1", "APMC Test 2", "APMC Test 3", "APMC Test 4", "APMC Test 5"]);

  fireEvent.click(screen.getByText("Show more"));
  expect(names(container)).toHaveLength(10);
  expect(names(container)[9]).toBe("APMC Test 10");
  expect(screen.getByText("₹9,100 per quintal")).toBeTruthy();

  fireEvent.click(screen.getByText("Show fewer"));
  expect(names(container)).toHaveLength(5);
});

test("7 mandis: 'Show more' adds only the 2 there are", () => {
  const { container } = render(<TopMandisPanel data={market(7)} />);
  fireEvent.click(screen.getByText("Show more"));
  expect(names(container)).toHaveLength(7);
});

test("5 or fewer mandis: no button", () => {
  render(<TopMandisPanel data={market(5)} />);
  expect(screen.queryByText("Show more")).toBeNull();
});

test("5 compared mandis and 2 from other days: the 2 come under 'Show more', below a line that says so", () => {
  const data = market(5);
  data.market[0].supporting_evidence.also_in_window = [
    { mandi: "APMC Older A", district: "Testland", gross_price: 9950, price_day: "2026-10-20", km: 10, compared: false },
    { mandi: "APMC Older B", district: "Testland", gross_price: 8000, price_day: "2026-10-19", km: 0, is_local: true },
    { mandi: "APMC Test 1", district: "Testland", gross_price: 1, price_day: "2026-10-19", km: 10 }, // already listed
  ];
  const { container } = render(<TopMandisPanel data={data} />);
  // the top 5 stay the compared ones, though an other-day price is higher than some of them
  expect(names(container)).toEqual(["APMC Test 1", "APMC Test 2", "APMC Test 3", "APMC Test 4", "APMC Test 5"]);
  expect(screen.queryByText(/Prices from other days/)).toBeNull();

  fireEvent.click(screen.getByText("Show more"));
  expect(names(container)).toEqual([
    "APMC Test 1", "APMC Test 2", "APMC Test 3", "APMC Test 4", "APMC Test 5", "APMC Older A", "APMC Older B",
  ]);
  expect(screen.getByText("Prices from other days. AIAIC did not compare these with the mandis above.")).toBeTruthy();
  expect(screen.getByText("Testland district · price seen on 20 Oct 2026 · about 10 km")).toBeTruthy();
});

test("rows that the summary marks as from another day never enter the top 5", () => {
  const data = market(5);
  data.market[0].summary = {
    price_compare: {
      rows: [
        ...data.market[0].supporting_evidence.options.map((o, i) => ({
          mandi: o.mandi, price: o.gross_price, day: o.price_day, km: o.km, role: i === 0 ? "chosen" : "compared",
        })),
        { mandi: "APMC Old Day", price: 99999, day: "2026-10-18", km: 5, role: "other_day" },
      ],
    },
  };
  const { container } = render(<TopMandisPanel data={data} />);
  expect(names(container)).not.toContain("APMC Old Day");
  fireEvent.click(screen.getByText("Show more"));
  expect(names(container)[5]).toBe("APMC Old Day");
});
