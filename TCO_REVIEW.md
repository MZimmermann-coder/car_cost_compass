# TCO Calculation Review

## Verdict

The recurring-cost calculations mostly make sense, but the purchase-side TCO has a material accounting bug: discounts are effectively ignored.

This review covers the current working tree, including its uncommitted TCO changes.

## Resolution Status

Each finding was independently reviewed after this report was written. All seven findings were confirmed and fixed in the working tree:

| Finding | Status | Resolution |
| --- | --- | --- |
| 1. Purchase discounts do not reduce TCO | Fixed | Economic TCO now includes an explicit first-year discount adjustment and reconciles paid price, subsidy, and residual value. |
| 2. Zero-year horizon produces negative TCO | Fixed | Non-positive horizons return neutral metrics, and the settings input now requires an integer of at least one. |
| 3. German thousands notation is misparsed | Fixed | Dot-grouped German integers such as `50.000` are parsed as 50,000 while decimal-dot inputs remain supported. |
| 4. Yearly totals double-count purchase and depreciation | Fixed | Purchase price is informational; annual and cumulative totals now represent economic TCO directly. |
| 5. Depreciation toggle leaves isolated credits | Fixed | Disabling vehicle-value effects now excludes depreciation, discount adjustment, and subsidy together while retaining informational residual value. |
| 6. Fallback depreciation schedule is erroneous | Fixed | Fallback rates now use the established `30/15/10/7/5/4` schedule. |
| 7. Headline tooltip arithmetic is incorrect | Fixed | Tooltips now describe the reconciled economic TCO calculation. |

Final verification included focused numeric invariants and a successful `npm run build`.

## Findings

### 1. High: Purchase discounts do not reduce TCO

In `src/lib/compute.js`, depreciation is calculated from the list price, while `computeOverviewMetrics` later subtracts the already-discounted purchase price from a cumulative value that already contains that purchase price.

Algebraically, the purchase price cancels, leaving approximately:

```text
TCO = list-price depreciation - BAFA + running costs + opportunity cost
```

Apart from its effect on opportunity cost, changing the discount therefore does not change TCO. In a focused check with opportunity cost set to zero, a EUR 50,000 vehicle had exactly the same TCO with a EUR 0 discount and a EUR 10,000 discount.

For the bundled Hyundai example, the app reports approximately **EUR 27,263**. A cash-flow-consistent calculation gives approximately **EUR 22,103** - exactly EUR 5,160 lower, matching its discount.

Relevant locations:

- `src/lib/compute.js:90-93`
- `src/lib/compute.js:149-155`

### 2. High: A zero-year horizon produces negative TCO

With a planning horizon of zero, `computeYearlyBreakdown` returns no rows. `computeOverviewMetrics` consequently starts with a total of zero but still subtracts the purchase price.

A EUR 50,000 purchased vehicle therefore receives a **EUR -50,000 TCO** and can rank as exceptionally cheap. The planning-horizon input currently has no positive minimum validation.

Relevant location: `src/lib/compute.js:149-163`.

### 3. High: German thousands notation is misparsed

The `num` function interprets `"50.000"` as `50`, although the German UI formats this as fifty thousand. `"50.000,00"` works, but the common integer form does not.

This can silently corrupt purchase prices and any other numeric cost input.

Relevant location: `src/lib/compute.js:14-20`.

### 4. Medium: Yearly totals double-count purchase and depreciation

The first-year total includes both the complete purchase cash outflow and depreciation. These represent two different views of the same ownership cost and should not be added together as ordinary costs.

The headline TCO later removes the purchase price, but the yearly table and chart still present the inflated values as `Jahreskosten` and `Kumuliert`. This makes the detail view inconsistent with the headline TCO.

Relevant locations:

- `src/lib/compute.js:114-126`
- `src/components/CostChart.svelte:36-59`

### 5. Medium: Disabling depreciation leaves BAFA as a free credit

With `Wertverlust im TCO` disabled, the purchase price still cancels from headline TCO, while BAFA remains a negative cost. A vehicle with no running or opportunity costs and EUR 10,000 BAFA consequently receives a **EUR -10,000 TCO**.

The rest-value tooltip also becomes mathematically false in this mode. It displays `base value - row.wertverlust`, although `row.wertverlust` is zero while the rest value continues to decrease using the hidden estimated depreciation.

Relevant locations:

- `src/lib/compute.js:89-94`
- `src/lib/compute.js:112-124`
- `src/components/CostTable.svelte:129-159`

### 6. Medium: The fallback depreciation schedule looks erroneous

The fallback schedule uses the following annual rates:

```text
Age 1:       26%
Age 2-3:     14%
Age 4-5:      6%
Age 6-8:     17%
Age 9-12:    15%
Age 13+:     12%
```

The rate unexpectedly rises from 6% to 17% for older vehicles. Under this schedule, a six-year-old vehicle depreciates faster over the following five years than a new vehicle.

The embedded data contains the much more plausible `30/15/10/7/5/4` schedule, so the source fallback values appear accidental and should be verified.

Relevant location: `src/lib/state.svelte.js:9-16`.

### 7. Low: The headline TCO tooltip contains incorrect arithmetic

The tooltip effectively states:

```text
cumulative - list price - discount = purchase price after discount
```

Those operations do not reconcile. It should show two separate calculations:

```text
list price - discount = purchase price
cumulative - purchase price = TCO
```

Relevant location: `src/views/Detail.svelte:115-138`.

## Recommended Formula

For purchased vehicles, use:

```text
TCO =
  effective purchase price
  - final residual value
  + recurring operating costs
  + one-time taxes
  + opportunity costs
```

Where:

```text
effective purchase price = list price - discount - subsidy
```

This allows a discount to reduce ownership cost while the independently estimated residual value remains based on the vehicle's market value.

For the depreciation-disabled mode, omit the complete acquisition/residual/subsidy block rather than retaining the subsidy by itself. Whether opportunity cost remains enabled should be an explicit product decision.

For leasing vehicles, TCO can remain the sum of lease payments and running costs, but a more complete model would also support initial payments, delivery fees, contract term, mileage limits, and expected return charges.

## Calculations That Are Internally Consistent

The following calculations are internally consistent with their current assumptions:

- Insurance and monthly vehicle tax are multiplied by 12.
- Leasing rates are multiplied by 12.
- Energy cost uses `annual km / 100 * consumption * unit price`.
- Maintenance and repair costs are compounded using the configured cost-increase rate.
- THG revenue is deducted annually for electric vehicles.
- Residual value is compounded using the age-dependent depreciation rates.

The opportunity-cost formula can represent foregone compound investment growth, but this convention should be documented. It differs from charging an annual opportunity rate against the vehicle's declining tied-up capital.

## Recommended Tests

Add focused unit tests for these invariants:

1. Increasing a discount by EUR X reduces purchase TCO by EUR X when other assumptions are unchanged.
2. A zero-year horizon never produces negative purchase-price TCO.
3. German-formatted values such as `50.000`, `50.000,00`, and `15,5` parse correctly.
4. Headline TCO reconciles with effective purchase price, final residual value, and all operating costs.
5. Enabling or disabling depreciation produces a clearly defined result without an isolated subsidy credit.
6. Depreciation never produces a negative residual value for accepted user inputs.
