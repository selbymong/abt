# Budget Projection Assumptions & Sources

This document records the assumptions, rates, and sources used to build the
5-year financial projections for the Harness Exchange platform. Four scenarios
exist: **Baseline** (platform-wide), **Give — With CI**, **Give — Without CI**,
and **Give — With CI + US** (Canadian launch bootstraps US expansion).

Last updated: 2026-04-06

---

## 1. User Growth Trajectory

### Baseline (Platform-Wide)

| Year | Users   | Tier          | Rationale |
|------|---------|---------------|-----------|
| FY2027 | 1,000   | Startup       | Pre-launch / private beta year |
| FY2028 | 10,000  | Growth        | Public launch, CI partnership live |
| FY2029 | 25,000  | Scale-early   | Interpolated 37.5% between Growth and Scale |
| FY2030 | 50,000  | Scale         | Full product-market fit |
| FY2031 | 100,000 | Enterprise-early | Interpolated 25% between Scale and Enterprise |

**Source / comparable:** Growth modeled on early-stage Canadian fintech/nonprofit
SaaS adoption curves. Comparable platforms
([CanadaHelps](https://www.canadahelps.org/en/the-giving-report/),
[Chimp](https://chimp.net/)) took 5-8 years to reach 100K active users.
Our 5-year target is aggressive but assumes the CI traffic advantage described
below.

### Give — With CI (Scenario A)

#### Traffic by Channel

| Year | CI Referral | Organic Search | Paid Media | Total Visitors |
|------|-------------|----------------|------------|----------------|
| FY2027 | 90,000 | 22,000 | 18,000 | 130,000 |
| FY2028 | 100,000 | 40,000 | 35,000 | 175,000 |
| FY2029 | 120,000 | 50,000 | 40,000 | 210,000 |
| FY2030 | 150,000 | 60,000 | 50,000 | 260,000 |
| FY2031 | 180,000 | 75,000 | 65,000 | 320,000 |

#### Registration Funnel

| Year | Total Visitors | Registered | Conversion |
|------|----------------|------------|------------|
| FY2027 | 130,000 | 1,300 | 1.0% |
| FY2028 | 175,000 | 5,000 | 2.9% |
| FY2029 | 210,000 | 14,000 | 6.7% |
| FY2030 | 260,000 | 30,000 | 11.5% |
| FY2031 | 320,000 | 55,000 | 17.2% |

**CI referral traffic — calculation:**

CI's traffic has been **declining** since its 2022 peak of 594,769 visits
(533K unique visitors). The decline accelerated through 2025:

| Year | CI Visits | CI Unique Visitors | YoY Change (Visits) |
|------|-----------|-------------------|---------------------|
| 2020 | 570,611 | 516,352 | +10.8% |
| 2021 | 526,391 | 478,648 | -7.7% |
| 2022 | 594,769 | 533,056 | +13.0% (Ukraine crisis peak) |
| 2023 | 465,210 | 400,097 | -21.8% (GA4 migration + structural) |
| 2024 | 447,732 | 363,364 | -3.8% |
| 2025* | 387,290 | 312,760 | -13.5% (11 months, annualized ~422K/~341K) |

Source: CI Webstats daily log (server-side, 2009-2025) and GA4 (2023-2025).
CI Web Traffic Analysis, prepared April 2026 (internal document).

**Decline drivers:** Increased competition from AI-generated charity
information (ChatGPT drove 3,036+ referral pageviews in 2025), Google SERP
features reducing click-through rates, and aging Joomla CMS hurting SEO
performance. The Harness platform migration (modern CMS, mobile-first,
structured data) is expected to stabilize and partially reverse this trend.

**CI unique visitor projections (base for referral calculation):**

| Year | CI Unique Visitors | Trajectory Assumption |
|------|-------------------|----------------------|
| FY2027 | 305,000 | Continued decline slowing; migration in progress |
| FY2028 | 295,000 | Trough year; migration complete, SEO recovery begins |
| FY2029 | 315,000 | Recovery: modern platform, improved mobile, structured data |
| FY2030 | 340,000 | Growth: AI readiness, French content, enhanced E-E-A-T |
| FY2031 | 365,000 | Sustained growth; unlikely to return to 2022 peak (533K) |

**Referral capture rate x CI base = CI referral visitors:**

| Year | CI Unique Visitors | Capture Rate | CI Referral | Integration Level |
|------|-------------------|-------------|-------------|-------------------|
| FY2027 | 305,000 | 30% | 90,000 | Cross-links on charity profile pages |
| FY2028 | 295,000 | 34% | 100,000 | Dedicated Give section in search results |
| FY2029 | 315,000 | 38% | 120,000 | Embedded donation widgets on CI pages |
| FY2030 | 340,000 | 44% | 150,000 | Co-branded giving flows, email cross-promo |
| FY2031 | 365,000 | 49% | 180,000 | Deep integration: CI as primary Give funnel |

The **capture rate** is the percentage of CI unique visitors who click through
to Give. Year 1 starts at 30% (simple cross-links, new/unfamiliar product) and
grows to 49% by Year 5 as integration deepens. Capture above 50% is unlikely
— CI's own data shows only 77% of pageviews are charity-related, and not all
charity-page visitors have giving intent (many are researchers, journalists,
charity staff checking ratings).

**Source:** Cross-site referral rates for partner integrations typically range
15-40% for loosely integrated partnerships, 40-60% for deeply embedded
integrations (source:
[Partnerize State of the Nation 2024](https://partnerize.com/resources/blog/report-state-of-the-nation-2024-affiliate-and-partner-marketing)).
CI-specific: 93% of CI site pageviews and 77% of organic search clicks go to
charity-related content (source: CI Web Traffic Analysis, Google Search Console
Dec 2024-Nov 2025, internal document).

**Organic search traffic:** Starts at 22K visitors (Year 1 SEO takes 6-12
months to generate meaningful results — source:
[Ahrefs "How Long Does SEO Take?"](https://ahrefs.com/blog/how-long-does-seo-take/),
2023). Grows to 75K by Year 5 through content marketing (charity guides, tax
receipt explainers, donor resources) and domain authority built from CI
backlinks. CI partnership accelerates organic growth via high-authority inbound
links. Note: CI's own organic search data shows strong positions (position
1.0-1.1 for brand queries, 1.5-2.5 for discovery queries), suggesting the
domain authority can be leveraged through Give's content.

**Paid media traffic:** Starts at 18K in Year 1, higher than originally
modeled because CI's declining traffic base means Give needs supplemental
channels earlier. Scales to 65K by Year 5 as Give pursues growth beyond CI's
audience. Blended paid CAC starts at $0.10/visitor (retargeting CI-warm
audiences) rising to $2.29/visitor for cold acquisition at scale.

**Registration rate improvement:** Starts at 1.0% (cold traffic, new product),
improves to 17.2% by Year 5 as Give builds trust, adds features, and CI
integration becomes seamless. Industry average for nonprofit platforms is 1.8%
visitor-to-registration (source:
[M+R Benchmarks 2024](https://2024.mrbenchmarks.com/) — nonprofit digital
marketing study). Our Year 5 rate exceeds this because CI traffic is
pre-qualified (visitors already researching charities).

### Give — Without CI (Scenario B)

#### Traffic by Channel

| Year | CI Referral | Organic Search | Paid Media | Total Visitors |
|------|-------------|----------------|------------|----------------|
| FY2027 | 0 | 8,000 | 32,000 | 40,000 |
| FY2028 | 0 | 25,000 | 75,000 | 100,000 |
| FY2029 | 0 | 50,000 | 130,000 | 180,000 |
| FY2030 | 0 | 80,000 | 200,000 | 280,000 |
| FY2031 | 0 | 120,000 | 260,000 | 380,000 |

#### Registration Funnel

| Year | Total Visitors | Registered | Conversion |
|------|----------------|------------|------------|
| FY2027 | 40,000 | 500 | 1.3% |
| FY2028 | 100,000 | 3,000 | 3.0% |
| FY2029 | 180,000 | 10,000 | 5.6% |
| FY2030 | 280,000 | 25,000 | 8.9% |
| FY2031 | 380,000 | 55,000 | 14.5% |

**CI referral traffic:** Zero — this scenario models Give as a standalone
platform without the CI partnership.

**Organic search traffic (Scenario B):** Starts at only 8K visitors (Year 1) — without CI's
high-authority backlinks, Give must build domain authority from scratch. SEO
takes 6-12 months to generate meaningful traffic (source:
[Ahrefs "How Long Does SEO Take?"](https://ahrefs.com/blog/how-long-does-seo-take/),
2023). Grows to 120K by Year 5 through heavy content investment ($42K-$138K/yr
in organic marketing spend — see Section 4).

**Paid media traffic:** The dominant channel without CI. 32K visitors in Year 1
scaling to 260K by Year 5. Blended paid CAC of $3.23/visitor in Year 1 (cold
audiences, no brand recognition), declining to $1.28/visitor by Year 5 as brand
awareness and retargeting pools grow. Source: Nonprofit platform CAC ranges
$1.50-$5.00/acquired visitor
([First Page Sage SaaS CAC benchmarks](https://firstpagesage.com/reports/average-customer-acquisition-cost-cac-by-industry-b2b-edition-fc/),
2024). Growth pattern modeled on ride-sharing platforms (Uber, Lyft) that spent
30-50% of revenue on marketing in early years, declining to 15-20% at maturity
(source: [Uber S-1 filing](https://www.sec.gov/Archives/edgar/data/1543151/000119312519103850/d647752ds1.htm),
2019; [Lyft 10-K](https://www.sec.gov/Archives/edgar/data/1759509/000175950921000011/lyft-20201231.htm),
2020). Nonprofit-specific: GoFundMe spent $50-80M/year on marketing in its
first 3 years to build from zero (source:
[Crunchbase — GoFundMe](https://www.crunchbase.com/organization/gofundme)).

### Give — With CI + US Expansion (Scenario C)

Canadian launch with CI (same as Scenario A) bootstraps US market entry 4
months later. The proven Canadian platform and "Charity Intelligence" trust
signal accelerate US growth vs cold entry.

**Timeline:** CA launches April 2026 (FY2027 start). US enters August 2026
(4 months later). FY2027 US = 8 months of activity.

**Bootstrap mechanism:** Canadian credibility provides:
- "As featured by Charity Intelligence Canada" trust signal in US marketing
- Cross-border charity referrals (many US 501(c)(3)s have Canadian affiliates)
- Proven platform with real user testimonials and charity ratings
- Press coverage from Canadian launch drives US tech/nonprofit media interest
- Existing compliance, security, and payment infrastructure to build on

#### US Traffic by Channel

| Year | Organic Search | Paid Media | PR / Referral | Total Visitors |
|------|----------------|------------|---------------|----------------|
| FY2027 (8mo) | 10,000 | 40,000 | 10,000 | 60,000 |
| FY2028 | 40,000 | 130,000 | 30,000 | 200,000 |
| FY2029 | 80,000 | 270,000 | 50,000 | 400,000 |
| FY2030 | 150,000 | 420,000 | 80,000 | 650,000 |
| FY2031 | 250,000 | 580,000 | 120,000 | 950,000 |

#### US Registration Funnel

| Year | Total Visitors | Registered | Conversion |
|------|----------------|------------|------------|
| FY2027 (8mo) | 60,000 | 1,200 | 2.0% |
| FY2028 | 200,000 | 12,000 | 6.0% |
| FY2029 | 400,000 | 40,000 | 10.0% |
| FY2030 | 650,000 | 95,000 | 14.6% |
| FY2031 | 950,000 | 200,000 | 21.1% |

US conversion rates start higher than CA's cold-start (2.0% vs 1.0%) because
the platform is already proven with Canadian testimonials and charity data.
By Year 5, US registration rate (21.1%) exceeds CA (17.2%) due to larger
addressable market and stronger network effects at scale.

#### Combined User Growth (CA + US)

| Year | CA Users | US Users | Combined | Infrastructure Tier |
|------|----------|----------|----------|---------------------|
| FY2027 | 1,300 | 1,200 | 2,500 | Startup → Growth (17%) |
| FY2028 | 5,000 | 12,000 | 17,000 | Growth → Scale (18%) |
| FY2029 | 14,000 | 40,000 | 54,000 | Scale → Enterprise (2%) |
| FY2030 | 30,000 | 95,000 | 125,000 | Scale → Enterprise (38%) |
| FY2031 | 55,000 | 200,000 | 255,000 | Enterprise |

US overtakes CA in users by Year 2, reflecting the ~10x larger addressable
market. Combined user growth pushes infrastructure into higher tiers faster
than either market alone — reaching Enterprise tier by Year 5.

#### US Revenue Model

| Parameter | Year 1 (8mo) | Year 5 | Source |
|-----------|--------------|--------|--------|
| Active donor % | 8% | 19% | Lower than CA; US market more competitive, less trust initially |
| Donations per donor/yr | 2.0 | 4.5 | US online avg is lower frequency than CA ([Network for Good 2023](https://www.networkforgood.com/resource/digital-giving-trends/)) |
| Avg donation (USD) | $250 | $400 | US online avg $200-250 (Network for Good); trends up with platform maturity |
| Platform fee | 3.5% | 3.2% | Same trajectory as CA; competitive with US market |
| Stripe fee (US) | 2.2% + $0.30 | 2.2% + $0.30 | [Stripe nonprofit discount](https://support.stripe.com/questions/fee-discount-for-nonprofit-organizations) — same as CA |

**Stripe nonprofit rate:** Stripe offers verified 501(c)(3) nonprofits a
discounted rate of **2.2% + $0.30** (vs standard US rate of 2.9% + $0.30).
Requires EIN/IRS verification and >80% of payment volume being tax-deductible
donations. Since Give operates through Harness Good US Foundation (501(c)(3)),
this rate applies. The US and CA Stripe costs are therefore identical.

**US margin note:** With the nonprofit Stripe rate, US per-transaction margins
match Canada's. On a $250 US donation at 3.5% platform fee: gross fee $8.75,
Stripe cost $5.80, net $2.95 (1.18% margin). Compare to CA $350 donation:
gross $12.25, Stripe $8.00, net $4.25 (1.21%). The margins are comparable;
the difference is driven by lower average US donation size.

#### US Marketing Spend

| Year | Organic | Paid Media | Total | Notes |
|------|---------|------------|-------|-------|
| FY2027 (8mo) | $10,000 | $40,000 | $50,000 | Bootstrap phase: leverage CA press |
| FY2028 | $36,000 | $150,000 | $186,000 | Brand building, paid acquisition |
| FY2029 | $60,000 | $240,000 | $300,000 | Scale: content + paid at volume |
| FY2030 | $84,000 | $320,000 | $404,000 | Growth: network effects reduce CAC |
| FY2031 | $108,000 | $400,000 | $508,000 | Maturity: organic share increasing |

US marketing is heavier than CA (no CI traffic equivalent) but lighter than
Scenario B (without CI) at equivalent user counts, because CA credibility
reduces cold-market acquisition costs by an estimated 20-30%.

#### US Compliance & Organizational Costs

| Cost | Y1 (8mo) | Y2 | Y3 | Y4 | Y5 |
|------|----------|-----|-----|-----|-----|
| State charity registrations | $3,333 | $8,000 | $12,000 | $15,000 | $18,000 |
| US legal counsel | $6,667 | $15,000 | $20,000 | $25,000 | $30,000 |
| Form 990 preparation | $0 | $3,500 | $5,000 | $7,500 | $10,000 |
| US bookkeeping | $2,000 | $6,000 | $9,000 | $12,000 | $15,000 |
| US D&O / liability insurance | $1,333 | $3,000 | $5,000 | $8,000 | $12,000 |

**State registrations:** Up to 41 US states require charity registration
before soliciting donations. Initial registrations in high-population states
(CA, NY, FL, TX, IL), expanding annually. Costs include filing fees and
registered agent services. Source: [National Association of State Charity
Officials](https://www.nasconet.org/).

**Form 990:** Required annual filing for US 501(c)(3) organizations or fiscal
sponsor reporting. Not filed in Year 1 (fiscal year not yet complete).

---

## 2. Revenue Model

### Transaction Fee Revenue

| Parameter | Year 1 | Year 5 | Source |
|-----------|--------|--------|--------|
| Active donor % | 8-12% | 21% | Industry avg: 10-15% ([M+R Benchmarks 2024](https://2024.mrbenchmarks.com/)) |
| Donations per donor/yr | 2.0-3.0 | 4.8 | [CanadaHelps](https://www.canadahelps.org/en/the-giving-report/) avg: 3.2 txns/donor/yr; recurring: 8-12/yr |
| Avg donation | $320-350 | $500 | [CRA T1 2023](https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/t1-final-statistics/2023-tax-year.html): median $390, online avg $500 |
| Platform fee | 3.5% | 3.2% | CanadaHelps: 4.0%; GoFundMe: 2.9%; Stripe: 2.9% + $0.30 |

**Revenue formula:**
```
Active Donors = Users x Active Donor %
Total Txns = Active Donors x Donations/Donor
Donation Volume = Total Txns x Avg Donation
Transaction Fee Revenue = Donation Volume x Platform Fee %
```

**Key sources for donation data:**

- **CRA T1 2023 data:** ~5M Canadian donors, $12.8B total charitable donations,
  median $390/donor, mean ~$2,272/donor. The median is more representative of
  typical online platform transactions.
  Source: [Canada Revenue Agency, T1 Individual Tax Statistics, 2023 tax year](https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/t1-final-statistics/2023-tax-year.html).

- **CanadaHelps 2023 Giving Report:** $444.7M processed, 881K unique donors,
  average ~$505/donation. This is the closest Canadian comparable to Give.
  Source: [CanadaHelps Giving Report 2023](https://www.canadahelps.org/en/the-giving-report/).

- **M+R Benchmarks 2024:** Nonprofit digital performance study across 220+
  organizations. Key metrics: average online gift size $204 (all orgs), $500+
  for high-value platforms. Monthly giving accounts for 28% of all online
  revenue.
  Source: [M+R Benchmarks 2024](https://2024.mrbenchmarks.com/).

**Fee rate rationale:** 3.5% starting rate is competitive with CanadaHelps (4%)
and positions Give as a lower-cost alternative. Slight decline to 3.2% at scale
reflects volume discounts to retain large charity partners.

### Payment Processing Costs (Stripe)

Stripe fees are modeled as a **cost of revenue** expense, not embedded in the
platform fee rate. The platform charges 3.5% to the donor; Stripe takes its
cut from that gross amount.

| Parameter | Rate | Source |
|-----------|------|--------|
| Stripe percentage fee | 2.2% of donation amount | [Stripe Canada pricing](https://stripe.com/en-ca/pricing) — domestic card rate |
| Stripe fixed fee | $0.30 per transaction | [Stripe Canada pricing](https://stripe.com/en-ca/pricing) |

**Net revenue per transaction:**
```
Gross platform fee  = Donation × Platform Fee %
Stripe cost         = Donation × 2.2% + $0.30
Net revenue         = Gross fee - Stripe cost
```

**Example at Year 1 ($350 avg donation, 3.5% fee):**
```
Gross fee    = $350 × 3.5%  = $12.25
Stripe cost  = $350 × 2.2% + $0.30 = $8.00
Net revenue  = $12.25 - $8.00 = $4.25 (1.21% effective net margin)
```

**Example at Year 5 ($500 avg donation, 3.2% fee):**
```
Gross fee    = $500 × 3.2%  = $16.00
Stripe cost  = $500 × 2.2% + $0.30 = $11.30
Net revenue  = $16.00 - $11.30 = $4.70 (0.94% effective net margin)
```

**Note:** At scale, Stripe offers volume discounts (custom pricing above ~$1M/yr
in volume). The 2.2% + $0.30 rate is conservative; actual costs may be lower
in Years 4-5. The fixed $0.30 per transaction has a larger impact on small
donations — recurring monthly gifts of $25 lose 1.2% to the fixed fee alone.

### Charity Partner SaaS Revenue

| Year | Partners | Avg Annual Fee | Total |
|------|----------|---------------|-------|
| FY2027 | 1-5 | $600 | $600-$3,000 |
| FY2028 | 10-35 | $900 | $9,000-$31,500 |
| FY2029 | 40-80 | $1,200 | $48,000-$96,000 |
| FY2030 | 100-150 | $1,500 | $150,000-$225,000 |
| FY2031 | 250-280 | $1,800 | $450,000-$504,000 |

**Rationale:** Premium SaaS tier for charity partners includes: donor analytics
dashboards, custom reporting, API access, branded giving pages, recurring gift
management, and tax receipt automation.

**Source / comparable:**
[Bloomerang](https://bloomerang.com/pricing/) charges $99-499/month
($1,200-$6,000/yr); [Donorbox Pro](https://donorbox.org/pricing) is $139/month
($1,668/yr); CanadaHelps charges custom rates for enterprise charities. Our
pricing starts low to build market share.

### Donation Seasonality (GIVING_SEASON Profile)

Donation revenue and related costs (Stripe processing fees) are distributed
across the fiscal year using a **giving-season seasonality curve** rather than
uniform monthly distribution. This reflects the well-documented concentration
of charitable giving around the holiday season.

| Month | Weight | Rationale |
|-------|--------|-----------|
| Jan | 8% | Post-holiday giving, New Year pledges, RRSP/tax-deadline awareness |
| Feb | 5% | Baseline |
| Mar | 6% | Fiscal year-end giving (many charities close books Mar 31) |
| Apr | 5% | Baseline |
| May | 5% | Baseline |
| Jun | 5% | Baseline |
| Jul | 4% | Summer low |
| Aug | 4% | Summer low |
| Sep | 5% | Back-to-school, early fall fundraising campaigns |
| Oct | 9% | Giving season begins; Thanksgiving (Canada), early appeals |
| Nov | 13% | GivingTuesday (~$100M+ in Canada, 2023), pre-holiday campaigns |
| Dec | 31% | Peak holiday giving; ~30% of all annual online donations |

**Sources:**

- **Blackbaud Institute, "Charitable Giving Report" (2023):** 30% of annual
  online giving occurs in December; 10% in the last 3 days of the year alone.
  Source: [Blackbaud Charitable Giving Report](https://institute.blackbaud.com/charitable-giving-report/).

- **M+R Benchmarks 2024:** November and December together account for 26-36%
  of annual online revenue across 220+ nonprofits surveyed. GivingTuesday
  alone drives 3-5% of annual revenue for participating orgs.
  Source: [M+R Benchmarks 2024](https://2024.mrbenchmarks.com/).

- **CanadaHelps 2023 Giving Report:** December is the peak month on the
  platform, with significant upticks starting in October. Year-end tax
  receipt deadlines drive last-minute giving.
  Source: [CanadaHelps Giving Report](https://www.canadahelps.org/en/the-giving-report/).

- **Network for Good, "Digital Giving Trends" (2023):** 47% of online
  donations are made in Q4 (Oct-Dec). January shows a secondary bump from
  New Year resolutions and delayed holiday giving.

**SaaS revenue** (charity partner subscriptions) uses **uniform** monthly
distribution — subscription billing is not seasonal.

### Marketing Spend Seasonality (GIVING_SEASON_MARKETING Profile)

Marketing spend leads donation activity — campaigns ramp up in Aug/Sep to
build awareness before the Oct-Dec giving season peak.

| Month | Weight | Rationale |
|-------|--------|-----------|
| Jan | 6% | New Year campaigns, light retargeting |
| Feb | 4% | Baseline |
| Mar | 5% | Fiscal year-end appeals |
| Apr | 4% | Baseline |
| May | 4% | Baseline |
| Jun | 5% | Mid-year giving campaigns |
| Jul | 5% | Early planning for fall campaigns |
| Aug | 6% | Creative production, audience building |
| Sep | 11% | Campaign launch; early giving season appeals |
| Oct | 15% | Heavy spend: Thanksgiving (CA), awareness campaigns |
| Nov | 18% | Peak spend: GivingTuesday buildup, pre-holiday push |
| Dec | 17% | Sustained spend through year-end; retargeting lapsed donors |

Marketing spend peaks in November (18%) — one month ahead of the donation
peak (December, 31%) — because ad campaigns need lead time to convert.
December spend remains high (17%) for last-minute year-end appeals and
retargeting. The Sep-Oct ramp (11% + 15%) captures early giving-season
intent and warms audiences for the Nov-Dec push.

**Source:** Nonprofit marketing calendars from
[Classy "The State of Modern Philanthropy"](https://www.classy.org/blog/the-state-of-modern-philanthropy/)
(2024) show 40-50% of annual marketing budgets deployed in Q4, with
Sep/Oct ramp-up accounting for another 15-20%.

**Infrastructure costs** use **uniform** monthly distribution — these are
steady-state operating expenses not tied to donation volume. The exception
is **Stripe processing fees**, which follow the GIVING_SEASON profile since
they scale directly with donation transaction volume.

---

## 3. Infrastructure Cost Model

All infrastructure costs are **monthly per-tier estimates** based on actual cloud
provider pricing as of Q1 2026.

### Cost Tiers

| Category | Startup (1K) | Growth (10K) | Scale (50K) | Enterprise (250K) |
|----------|-------------|-------------|------------|------------------|
| Compute & Hosting | $35 | $85 | $400 | $1,050 |
| PostgreSQL + pgvector | $18 | $100 | $375 | $1,400 |
| Redis Cache | $5 | $35 | $150 | $300 |
| Kafka / Event Streaming | $0 | $55 | $200 | $1,000 |
| AI/LLM Tokens (Claude) | $10 | $100 | $475 | $2,350 |
| Email (Resend) | $0 | $30 | $75 | $300 |
| SMS (Twilio) | $2 | $25 | $90 | $450 |
| CDN + Storage (S3/CF) | $6 | $35 | $170 | $500 |
| Monitoring | $0 | $30 | $80 | $200 |
| Search (Elasticsearch) | $0 | $75 | $300 | $700 |
| Domain + SSL | $15 | $15 | $15 | $15 |

**Sources and pricing basis:**

- **Compute:** [DigitalOcean](https://www.digitalocean.com/pricing/droplets) /
  [AWS ECS Fargate](https://aws.amazon.com/fargate/pricing/). Startup: 1 small
  instance ($20-40). Scale: 4-8 instances with autoscaling ($200-400 app +
  $80-200 Kafka workers). Enterprise: multi-AZ with dedicated instances.

- **PostgreSQL + pgvector:**
  [AWS RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/).
  Startup: shared instance. Growth: dedicated db.r6g.large ($100/mo). Scale:
  Multi-AZ db.r6g.xlarge. Enterprise: db.r6g.2xlarge with read replicas.

- **Redis:** [Upstash](https://upstash.com/pricing/redis) /
  [AWS ElastiCache](https://aws.amazon.com/elasticache/pricing/). Free tier at
  startup; dedicated cache nodes at scale.

- **Kafka:** Startup uses PG-only (LISTEN/NOTIFY). Growth:
  [Upstash Kafka](https://upstash.com/pricing/kafka) or
  [Confluent Cloud](https://www.confluent.io/confluent-cloud/pricing/) basic.
  Scale+: Confluent Cloud dedicated.

- **AI/LLM (Claude):**
  [Anthropic API pricing](https://www.anthropic.com/pricing)
  (claude-sonnet-4-20250514: $3/$15 per MTok). Startup: light assistant queries.
  Enterprise: heavy classification, tax credit identification, weight learning.
  Estimated at ~$0.01/request avg, scaling with user activity.

- **Email:** [Resend](https://resend.com/pricing). Free tier (100/day) at
  startup. Growth: $20-40/mo for 10K-50K emails. Enterprise: dedicated IP,
  volume pricing.

- **SMS:** [Twilio](https://www.twilio.com/en-us/sms/pricing/ca).
  $0.0079/SMS (Canada). Startup: minimal verification. Enterprise: 50K+ SMS/mo
  for 2FA and notifications.

- **CDN + Storage:** [AWS CloudFront](https://aws.amazon.com/cloudfront/pricing/)
  \+ [AWS S3](https://aws.amazon.com/s3/pricing/). Near-zero at startup.
  Enterprise: high-bandwidth static assets, donation receipts, document storage.

- **Monitoring:** [Grafana Cloud](https://grafana.com/pricing/) free tier at
  startup. Scale: [Datadog](https://www.datadoghq.com/pricing/) or Grafana
  Cloud Pro ($80-200/mo).

- **Search (Elasticsearch):**
  [Elastic Cloud](https://www.elastic.co/pricing). SQL full-text search at
  startup. Growth: Elastic Cloud basic. Enterprise: dedicated cluster for
  charity search, donor lookup.

### Tier Interpolation Method

When a year falls between tiers, costs are linearly interpolated:
```
cost = tierA x (1 - t) + tierB x t
```
where `t` is the interpolation factor (e.g., 0.375 for 37.5% toward next tier).

### Annual Compliance & Security Costs

| Cost | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Source |
|------|--------|--------|--------|--------|--------|--------|
| PCI-DSS Compliance | $250 | $250 | $500 | $500 | $500 | SAQ-A self-assessment (card-not-present). [PCI SSC Document Library](https://www.pcisecuritystandards.org/document_library/) |
| Penetration Testing | $5,000 | $5,000 | $10,000 | $10,000 | $15,000 | Annual pentest required for PCI. Canadian cybersecurity firms: $5K-$20K (vendor quotes, 2025) |
| SOC 2 Type II Audit | $0 | $25,000 | $30,000 | $35,000 | $40,000 | Required for enterprise charity partners. [Vanta SOC 2 Audit Cost Guide](https://www.vanta.com/collection/soc-2/soc-2-audit-cost) |
| [Apple Developer Program](https://developer.apple.com/support/compare-memberships/) | $99 | $99 | $99 | $99 | $99 | Annual membership fee |

---

## 4. Marketing & User Acquisition

### Scenario A — With CI (Low-Cost Acquisition)

| Channel | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---------|--------|--------|--------|--------|--------|
| CI Referral (partnership) | $0 | $0 | $0 | $0 | $0 |
| Organic Marketing (SEO/content) | $6,000 | $12,000 | $18,000 | $24,000 | $30,000 |
| Paid Media (ads) | $1,800 | $4,600 | $53,000 | $100,400 | $148,800 |
| **Total** | **$7,800** | **$16,600** | **$71,000** | **$124,400** | **$178,800** |

#### Cost per Visitor by Channel

| Channel | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---------|--------|--------|--------|--------|--------|
| CI Referral | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| Organic Search | $0.27 | $0.30 | $0.36 | $0.40 | $0.40 |
| Paid Media | $0.10 | $0.13 | $1.33 | $2.01 | $2.29 |
| **Blended** | **$0.06** | **$0.10** | **$0.34** | **$0.48** | **$0.56** |

**Rationale:** CI partnership provides 69% of Year 1 traffic at zero
incremental cost — the primary value proposition of the partnership. However,
CI's declining traffic base (down ~35% from 2022 peak) means Give cannot rely
solely on CI referrals for growth. Organic marketing covers content/SEO
($500/mo Year 1, growing to $2,500/mo). Paid media scales from Year 3 onward
to compensate for CI's constrained ceiling. Blended cost per visitor stays
well below industry norms due to CI's contribution but rises as the paid
share grows.

### Scenario B — Without CI (Full-Cost Acquisition)

| Channel | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---------|--------|--------|--------|--------|--------|
| CI Referral (partnership) | $0 | $0 | $0 | $0 | $0 |
| Organic Marketing (SEO/content) | $42,000 | $72,000 | $96,000 | $120,000 | $138,000 |
| Paid Media (ads) | $103,200 | $164,400 | $226,800 | $277,200 | $333,600 |
| **Total** | **$145,200** | **$236,400** | **$322,800** | **$397,200** | **$471,600** |

#### Cost per Visitor by Channel

| Channel | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---------|--------|--------|--------|--------|--------|
| CI Referral | N/A | N/A | N/A | N/A | N/A |
| Organic Search | $5.25 | $2.88 | $1.92 | $1.50 | $1.15 |
| Paid Media | $3.23 | $2.19 | $1.74 | $1.39 | $1.28 |
| **Blended** | **$3.63** | **$2.36** | **$1.79** | **$1.42** | **$1.24** |

**Rationale:** Without CI, all traffic must be purchased or earned. Organic
spend includes full-time SEO, content writers, and social media ($3,500/mo
Year 1, scaling to $11,500/mo) — organic cost per visitor declines from $5.25
to $1.15 as content compounds and domain authority grows. Paid media at
$3.23/visitor in Year 1 (cold audiences, no brand) declining to $1.28/visitor
by Year 5 as retargeting pools and brand recognition build.

**Sources:**

- **Blended CAC:** Nonprofit platform CAC ranges from $1.50-$5.00/acquired user.
  Source: [First Page Sage — Average CAC by Industry](https://firstpagesage.com/reports/average-customer-acquisition-cost-cac-by-industry-b2b-edition-fc/), 2024.

- **Paid media growth pattern:** Modeled on ride-sharing platforms that spent
  30-50% of revenue on marketing in early years, declining to 15-20% at maturity.
  Source: [Uber S-1 filing](https://www.sec.gov/Archives/edgar/data/1543151/000119312519103850/d647752ds1.htm) (2019);
  [Lyft 10-K](https://www.sec.gov/Archives/edgar/data/1759509/000175950921000011/lyft-20201231.htm) (2020).

- **Organic SEO timeline:** SEO takes 6-12 months to generate meaningful traffic.
  Source: [Ahrefs — How Long Does SEO Take?](https://ahrefs.com/blog/how-long-does-seo-take/) (2023).

- **Organic cost efficiency:** Content marketing cost per visitor typically
  starts at $3-8 (new domain) and declines to $0.50-$1.50 at maturity.
  Source: [First Page Sage — Marketing ROI by Channel](https://firstpagesage.com/seo-blog/marketing-roi-by-channel/), 2024.

---

## 5. Organizational Costs (Per Entity)

Four entities exist in the group. Each has distinct corporate, legal, and
governance costs. All amounts in the entity's local currency (CAD or USD).

### 5a. Harness Exchange — CA For-Profit (CBCA / Ontario)

#### One-Time Formation Costs

| Cost | Amount | Source |
|------|--------|--------|
| Federal incorporation ([Corporations Canada](https://ised-isde.canada.ca/site/corporations-canada/en/services-fees-and-processing-times)) | $200 | Online filing; $250 paper |
| NUANS name search | $60 | Required for federal incorporation |
| Ontario extra-provincial registration ([Ontario Business Registry](https://www.ontario.ca/page/cost-time-required-to-register-change-search-for-business-name-corporation-not-for-profit)) | $330 | Required for federally incorporated corps operating in ON |
| HST/GST registration | $0 | Free; mandatory once revenue exceeds $30K/4 quarters |
| **Total formation** | **$590** | |

#### Annual Recurring Costs

| Cost | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Source |
|------|--------|--------|--------|--------|--------|--------|
| Annual return (federal + ON) | $50 | $50 | $50 | $50 | $50 | [$12 federal](https://ised-isde.canada.ca/site/corporations-canada/en/services-fees-and-processing-times) + ~$25 ON |
| T2 corporate tax return | $1,200 | $1,500 | $2,000 | $2,500 | $3,000 | Small corp: $800-1,500; complex: $1,800-3,000. [Tohme Accounting](https://www.tohme-accounting.com/post/corporate-tax-filing-fees/) |
| HST/GST filing (accountant) | $1,200 | $1,200 | $2,000 | $2,000 | $2,000 | $300-500/quarter; annual if under $1.5M revenue |
| Bookkeeping | $3,600 | $6,000 | $9,600 | $12,000 | $18,000 | $300/mo startup → $1,500/mo at scale |
| Financial review/audit | $0 | $5,000 | $10,000 | $15,000 | $20,000 | Review engagement Year 2-3; full audit Year 4+. [CPA Canada](https://www.cpacanada.ca/) |
| D&O insurance | $3,000 | $3,000 | $5,000 | $7,000 | $10,000 | $1M coverage. [Summit Cover](https://www.summitcover.ca/post/d-o-insurance-cost) |
| Commercial general liability | $800 | $800 | $1,200 | $1,500 | $2,000 | $1-2M coverage, low-risk tech. [KBD Insurance](https://kbdinsurance.com/blog/business-insurance-cost-ontario/) |
| Cyber / tech E&O insurance | $2,000 | $3,000 | $5,000 | $8,000 | $12,000 | SaaS/fintech toward higher end. [WHINS Guide](https://www.whins.com/tech-eo-and-cyber-insurance-for-startups-2025-guide-to-protection-compliance/) |
| Legal retainer | $5,000 | $8,000 | $12,000 | $15,000 | $20,000 | Corporate counsel, contract review, regulatory |
| Board of Directors | $0 | $0 | $5,000 | $10,000 | $20,000 | Year 1-2: equity-only (0.25-0.5%/yr per director). Cash comp starts Year 3 post-traction. [MaRS — Board Compensation](https://learn.marsdd.com/article/how-do-you-appropriately-compensate-board-members/) |
| Registered agent / corp secretary | $500 | $500 | $500 | $500 | $500 | Basic registered office service |
| Business banking fees | $0 | $600 | $1,200 | $1,500 | $1,500 | Free startup accounts → $50-125/mo at scale |
| **Total (annual)** | **$17,350** | **$29,650** | **$53,550** | **$75,050** | **$109,050** | |

### 5b. Harness Good — CA Not-for-Profit (CNCA)

#### One-Time Formation Costs

| Cost | Amount | Source |
|------|--------|--------|
| Federal NFP incorporation ([CNCA](https://ised-isde.canada.ca/site/corporations-canada/en/services-fees-and-processing-times)) | $200 | Same fee as CBCA |
| CRA charity registration | $0 | No government fee |
| Legal costs for charity application | $3,000 | Typical range $2,000-5,000. [Charity Law Group](https://www.charitylawgroup.ca/) |
| **Total formation** | **$3,200** | |

#### Annual Recurring Costs

| Cost | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Source |
|------|--------|--------|--------|--------|--------|--------|
| Annual return (federal) | $12 | $12 | $12 | $12 | $12 | [Corporations Canada](https://ised-isde.canada.ca/site/corporations-canada/en/services-fees-and-processing-times) |
| [T3010 charity return](https://www.canada.ca/en/revenue-agency/services/charities-giving/charities/operating-a-registered-charity/filing-t3010-charity-return.html) (accountant) | $1,500 | $2,000 | $2,500 | $3,000 | $3,500 | More complex than T2 due to disbursement quota |
| Bookkeeping | $2,400 | $3,600 | $6,000 | $9,600 | $12,000 | $200/mo startup → $1,000/mo at scale |
| Financial audit | $0 | $8,000 | $10,000 | $15,000 | $20,000 | Required when gross revenue >$250K. [CRA requirements](https://www.canada.ca/en/revenue-agency/services/charities-giving/charities/operating-a-registered-charity/filing-t3010-charity-return.html) |
| General liability insurance | $500 | $500 | $800 | $1,000 | $1,500 | Lower risk profile than FP entity |
| Cyber insurance | $1,500 | $2,000 | $3,000 | $5,000 | $8,000 | Handling donor PII and payment data |
| Legal retainer | $3,000 | $5,000 | $8,000 | $10,000 | $12,000 | Charity law compliance, CRA correspondence |
| Board of Directors | $0 | $0 | $0 | $0 | $0 | Registered charities generally cannot compensate directors for board service; expenses reimbursed only. [Charity Law Group](https://www.charitylawgroup.ca/charity-law-questions/can-a-canadian-charity-provide-benefits-to-its-directors) |
| **Total (annual)** | **$8,912** | **$21,112** | **$30,312** | **$43,612** | **$57,012** | |

### 5c. US For-Profit (Delaware C-Corp)

#### One-Time Formation Costs

| Cost | Amount (USD) | Source |
|------|-------------|--------|
| Delaware incorporation filing | $109 | [Delaware Division of Corporations](https://corp.delaware.gov/fee/) |
| Registered agent (Year 1 included) | $50 | Required; typical $50-300/yr |
| **Total formation** | **$159** | |

#### Annual Recurring Costs

| Cost | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Source |
|------|--------|--------|--------|--------|--------|--------|
| Delaware franchise tax | $400 | $400 | $400 | $400 | $400 | Minimum $175-400/yr. [Delaware fee schedule](https://corp.delaware.gov/fee/) |
| Delaware annual report | $50 | $50 | $50 | $50 | $50 | Due March 1 annually |
| Registered agent | $50 | $50 | $50 | $50 | $50 | e.g. Harvard Business Services |
| Form 1120 tax return | $1,500 | $2,000 | $3,000 | $3,500 | $5,000 | US CPA; increases with intercompany complexity |
| Financial audit | $0 | $0 | $10,000 | $15,000 | $20,000 | Required once material revenue; US audit costs higher |
| D&O insurance | $2,000 | $2,000 | $4,000 | $6,000 | $8,000 | US coverage; slightly lower than CA due to smaller operations |
| General liability + cyber | $1,500 | $2,000 | $3,000 | $5,000 | $8,000 | Bundled US policies |
| Legal (US corporate counsel) | $3,000 | $5,000 | $8,000 | $10,000 | $15,000 | State compliance, IP, contracts |
| Board of Directors | $0 | $0 | $3,000 | $5,000 | $10,000 | Cash comp post-traction; equity in early years |
| **Total (annual, USD)** | **$8,500** | **$11,500** | **$31,500** | **$45,000** | **$66,500** | |

### 5d. US Not-for-Profit (Delaware 501(c)(3))

#### One-Time Formation Costs

| Cost | Amount (USD) | Source |
|------|-------------|--------|
| Delaware NFP incorporation | $109 | [Delaware fee schedule](https://corp.delaware.gov/fee/) |
| IRS 501(c)(3) determination (Form 1023) | $600 | $275 for Form 1023-EZ if eligible |
| Legal costs for 501(c)(3) application | $3,000 | Typical range $2,000-5,000 |
| **Total formation** | **$3,709** | |

#### Annual Recurring Costs

| Cost | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 | Source |
|------|--------|--------|--------|--------|--------|--------|
| Delaware annual report (exempt) | $25 | $25 | $25 | $25 | $25 | Exempt domestic corps rate |
| Delaware franchise tax | $0 | $0 | $0 | $0 | $0 | Exempt for 501(c)(3) |
| Form 990 preparation | $1,000 | $1,500 | $2,000 | $2,000 | $2,000 | 990-EZ if under $200K; full 990 above. [Taylor Roth](https://taylorroth.com/services/irs-form-990-preparation-2-2-2-2/) |
| Financial audit | $0 | $5,000 | $8,000 | $12,000 | $15,000 | Required by many state AGs above $250K-$500K |
| General liability + cyber | $1,000 | $1,500 | $2,500 | $4,000 | $6,000 | Lower risk profile; bundled |
| Legal (US NFP counsel) | $2,000 | $3,000 | $5,000 | $8,000 | $10,000 | State charity registration, compliance |
| Board of Directors | $0 | $0 | $0 | $0 | $0 | 501(c)(3) boards typically uncompensated |
| **Total (annual, USD)** | **$4,025** | **$11,025** | **$17,525** | **$26,025** | **$33,025** | |

### Organizational Cost Summary (All Entities)

| Entity | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|--------|--------|--------|--------|--------|--------|
| Harness Exchange (CAD) | $17,350 | $29,650 | $53,550 | $75,050 | $109,050 |
| Harness Good (CAD) | $8,912 | $21,112 | $30,312 | $43,612 | $57,012 |
| US For-Profit (USD) | $8,500 | $11,500 | $31,500 | $45,000 | $66,500 |
| US Not-for-Profit (USD) | $4,025 | $11,025 | $17,525 | $26,025 | $33,025 |

**Note:** US amounts are in USD. At a projected USD/CAD rate of ~1.36, the US
entities add approximately CAD $17,000 (Year 1) to CAD $135,000 (Year 5) to
consolidated group costs.

---

## 6. Funnel Conversion Rates

| Stage | Rate | Source |
|-------|------|--------|
| Visitor -> Registered | 1.8% (industry baseline) | [M+R Benchmarks 2024](https://2024.mrbenchmarks.com/) |
| Registered -> Active Donor | 8-22% (grows with platform maturity) | Industry range: 10-15% for established platforms. Our Year 1 is lower (new platform, low trust), Year 5 higher (mature, recurring). Source: [Bloomerang donor retention reports](https://bloomerang.com/blog/donor-retention/). |
| Donation frequency | 2.0-5.0 txns/donor/yr | [CanadaHelps](https://www.canadahelps.org/en/the-giving-report/): ~3.2 avg. Monthly recurring givers: 12/yr. Source: [AFP Fundraising Effectiveness Project](https://afpglobal.org/FundraisingEffectivenessProject). |

---

## 7. Key Modeling Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Currency | CAD (CA entities), USD (US entities) | Harness Exchange is a Canadian corporation (ASPE); US entities report in USD |
| Fiscal year | Calendar year (Jan-Dec) | Standard for CA for-profit entities |
| Fee model | % of donation volume | Industry standard for payment platforms; aligns incentives with charity partners |
| Fee rate decline | 3.5% -> 3.2% over 5yr | Volume discount expectation; stays competitive as platform scales |
| Infrastructure scaling | Linear interpolation between tiers | Smooth cost curve; avoids step-function jumps that don't reflect gradual scaling |
| Marketing spend | Scenario-differentiated | The core question: what is CI's existing traffic worth in avoided marketing spend? |
| Both scenarios converge at Year 5 | 55K registered users | Assumes both paths can reach same outcome; the question is cost/time to get there |

---

## 8. DAF Revenue Model (Harness Good)

### Overview

A Donor-Advised Fund (DAF) offered through Harness Good (CA registered
charity). Donors make irrevocable contributions, receive an immediate tax
receipt, and recommend grants to qualified charities over time. Revenue comes
from fees on assets under management (AUM), which compound as the fund grows.

**Entity:** Harness Good (CA Not-for-Profit, ASNFPO, CNCA)

**Key regulatory context:**
- DAFs must be held by a qualified donee (registered charity) — Harness Good
  qualifies under CRA rules
- CRA has no statutory minimum payout rate for DAFs (unlike the US 5% rule for
  private foundations), though the disbursement quota (3.5% of assets) applies
  to the charity overall
- Contributions are irrevocable — once donated, the money belongs to Harness
  Good; donors only *recommend* grants
- Source: [CRA Guidance on DAFs](https://www.canada.ca/en/revenue-agency/services/charities-giving/charities/policies-guidance/donor-advised-funds.html)

### Fee Structure

Fees charged to donor accounts (total cost to donor: 1.00% of AUM):

| Fee | Rate | Recipient | Notes |
|-----|------|-----------|-------|
| Administrative fee | 0.60% of AUM | Harness Good | Covers compliance, technology, operations |
| Investment management fee | 0.40% of AUM | Split (see below) | Pooled investment program |
| — Investment manager share | 0.25% of AUM | External manager | NEI Investments, Wealthsimple, etc. |
| — HG investment spread | 0.15% of AUM | Harness Good | Net spread after manager costs |

**Harness Good total take: 0.75% of AUM** (admin 0.60% + spread 0.15%)

**Competitive positioning:**

| Sponsor | Admin Fee | Investment | Total | Source |
|---------|-----------|------------|-------|--------|
| Vancouver Foundation | 0.75-1.50% | varies | 1.5-2.5% | [vf.ca/DAF](https://www.vancouverfoundation.ca/donor-advised-funds) |
| CanadaHelps (Impact Accounts) | 1.00% | included | ~1.5% | [canadahelps.org](https://www.canadahelps.org/en/impact-accounts/) |
| Calgary Foundation | 0.75-1.00% | varies | 1.5-2.0% | [calgaryfoundation.org](https://calgaryfoundation.org/) |
| Fidelity Charitable (US) | 0.60% | varies | 0.6-1.0% | [fidelitycharitable.org](https://www.fidelitycharitable.org/) |
| **Harness Good** | **0.60%** | **0.40%** | **1.00%** | Competitive with US leaders, undercuts CA community foundations |

### AUM Growth Model

```
new_contributions = new_accounts × avg_initial_contribution
additional_contributions = prior_accounts × additional_rate × avg_additional
total_inflows = new_contributions + additional_contributions
investment_returns = (beg_AUM + total_inflows / 2) × 6%
grants_out = beg_AUM × payout_rate
end_AUM = beg_AUM + total_inflows + investment_returns - grants_out
avg_AUM = (beg_AUM + end_AUM) / 2
```

**Investment return assumption: 6%** — balanced portfolio (60/40 equity/fixed
income) net of the investment manager's 0.25% fee. Based on historical
10-year average for balanced Canadian mutual funds
([Morningstar Canada Fund Performance](https://www.morningstar.ca/)).

**Grant payout rate:** Starts at 0% (Year 1 — accounts too new to grant),
ramps to 10% (Year 2), then 12% at maturity. Canadian DAF payout rates
average 8-15% of AUM. Source: [Imagine Canada,
"Donor-Advised Funds in Canada" (2023)](https://www.imaginecanada.ca/).

### Scenario A: DAF — Organic (Give Cross-sell)

DAF grows primarily from Give donor base. Minimal marketing — conversion
happens through in-platform prompts, year-end tax optimization messaging,
and the natural progression from one-time giving to strategic philanthropy.

#### Account & AUM Growth

| Year | New Accounts | Total | Avg Initial | New $ | Add'l $ | Beg AUM | Returns | Grants | End AUM |
|------|-------------|-------|-------------|-------|---------|---------|---------|--------|---------|
| FY2027 | 30 | 30 | $18K | $540K | $0 | $0 | $16K | $0 | $556K |
| FY2028 | 80 | 110 | $25K | $2.0M | $60K | $556K | $95K | $56K | $2.7M |
| FY2029 | 200 | 310 | $35K | $7.0M | $264K | $2.7M | $377K | $319K | $10.0M |
| FY2030 | 400 | 710 | $45K | $18.0M | $1.0M | $10.0M | $1.2M | $1.2M | $29.0M |
| FY2031 | 700 | 1,410 | $55K | $38.5M | $3.2M | $29.0M | $3.0M | $3.5M | $70.2M |

**Account growth rationale:** Give has 1,300–55,000 users over 5 years
(Scenario A). DAF conversion targets the top 5-10% of donors by gift size
— those giving $1,000+/year who would benefit from tax-optimized giving.
Year 1 is conservative (30 accounts from ~130 active donors). By Year 5,
1,410 accounts from 11,550 active donors = 12.2% penetration of active
donor base.

**Avg initial contribution:** Starts at $18K (accessible entry point,
lower than community foundation $25K minimums) and grows to $55K as the
platform attracts higher-value donors through track record and advisor
referrals.

#### Revenue

| Year | Avg AUM | Admin Fee (0.60%) | Inv Spread (0.15%) | Total Revenue |
|------|---------|-------------------|--------------------|---------------|
| FY2027 | $278K | $1,668 | $417 | $2,085 |
| FY2028 | $1.6M | $9,634 | $2,409 | $12,043 |
| FY2029 | $6.3M | $37,896 | $9,474 | $47,370 |
| FY2030 | $19.5M | $116,847 | $29,212 | $146,059 |
| FY2031 | $49.6M | $297,453 | $74,363 | $371,816 |

5-year total revenue: **$579K**

#### DAF-Specific Operating Costs (Incremental)

These are costs specific to the DAF program, on top of existing Harness
Good organizational costs (T3010, bookkeeping, audit, etc. from Section 5b).

| Cost | Y1 | Y2 | Y3 | Y4 | Y5 |
|------|-----|-----|-----|-----|-----|
| DAF compliance staff | $15K | $20K | $35K | $55K | $80K |
| Investment committee | $0 | $0 | $5K | $10K | $15K |
| DAF technology platform | $10K | $15K | $20K | $30K | $40K |
| Fidelity bond & E&O | $2K | $3K | $5K | $8K | $12K |
| Investment legal counsel | $3K | $5K | $8K | $12K | $18K |
| Marketing (cross-sell) | $2K | $5K | $8K | $12K | $18K |
| **Total** | **$32K** | **$48K** | **$81K** | **$127K** | **$183K** |

**Cost notes:**

- **Compliance staff:** Part-time contractor in Year 1 ($15K), growing to
  full-time dedicated DAF operations manager by Year 5 ($80K). Handles
  grant due diligence, CRA reporting, investment policy compliance.

- **Investment committee:** Required once AUM exceeds ~$5M (CRA best
  practice). 3-4 external members meeting quarterly. Year 1-2: handled by
  board. Cash compensation starts Year 3.

- **Technology:** Portfolio dashboard, grant recommendation engine,
  account statements, tax receipt integration. Year 1 builds on existing
  Harness Platform; grows as DAF-specific features mature.

- **Fidelity bond:** Required for organizations holding client funds.
  Scales with AUM. Source: [Intact Insurance —
  Fidelity Bonds](https://www.intactinsurance.com/).

- **Investment counsel:** Securities law advice for investment policy
  statement, fund governance, and regulatory compliance.

#### P&L Summary — Organic

| Year | Revenue | Costs | Net | Margin |
|------|---------|-------|-----|--------|
| FY2027 | $2K | $32K | -$30K | N/A |
| FY2028 | $12K | $48K | -$36K | -299% |
| FY2029 | $47K | $81K | -$34K | -71% |
| FY2030 | $146K | $127K | **$19K** | 13% |
| FY2031 | $372K | $183K | **$189K** | 51% |
| **Total** | **$579K** | **$471K** | **$108K** | 19% |

Breaks even in **Year 4**. 5-year cumulative net: **$108K**.

### Scenario B: DAF — Active Growth (HNW + Advisor Partnerships)

Dedicated marketing to high-net-worth individuals through financial
advisor partnerships, wealth management firms, and targeted campaigns.
Higher average account size, faster AUM accumulation, but significantly
higher marketing and compliance costs.

#### Account & AUM Growth

| Year | New Accounts | Total | Avg Initial | New $ | Add'l $ | Beg AUM | Returns | Grants | End AUM |
|------|-------------|-------|-------------|-------|---------|---------|---------|--------|---------|
| FY2027 | 80 | 80 | $30K | $2.4M | $0 | $0 | $72K | $0 | $2.5M |
| FY2028 | 270 | 350 | $45K | $12.2M | $240K | $2.5M | $520K | $247K | $15.1M |
| FY2029 | 650 | 1,000 | $60K | $39.0M | $1.5M | $15.1M | $2.1M | $1.8M | $56.0M |
| FY2030 | 1,500 | 2,500 | $75K | $112.5M | $6.3M | $56.0M | $6.9M | $6.7M | $174.9M |
| FY2031 | 2,500 | 5,000 | $90K | $225.0M | $18.8M | $174.9M | $17.8M | $21.0M | $415.5M |

**Account growth drivers:**
- Financial advisor referral program (20+ advisor partnerships by Year 3)
- Wealth management firm integrations (API for portfolio-level giving)
- HNW events (philanthropic planning workshops, $5-10K per event)
- Give-to-DAF upgrade path (automated prompts for donors giving $2K+/yr)

#### Revenue

| Year | Avg AUM | Admin Fee (0.60%) | Inv Spread (0.15%) | Total Revenue |
|------|---------|-------------------|--------------------|---------------|
| FY2027 | $1.2M | $7,416 | $1,854 | $9,270 |
| FY2028 | $8.8M | $52,821 | $13,205 | $66,026 |
| FY2029 | $35.6M | $213,354 | $53,339 | $266,693 |
| FY2030 | $115.5M | $692,757 | $173,189 | $865,946 |
| FY2031 | $295.2M | $1,771,317 | $442,829 | $2,214,146 |

5-year total revenue: **$3.42M**

#### DAF-Specific Operating Costs (Incremental)

| Cost | Y1 | Y2 | Y3 | Y4 | Y5 |
|------|-----|-----|-----|-----|-----|
| DAF compliance staff | $25K | $40K | $70K | $120K | $180K |
| Investment committee | $0 | $5K | $10K | $15K | $20K |
| DAF technology platform | $15K | $25K | $40K | $60K | $80K |
| Fidelity bond & E&O | $3K | $5K | $10K | $18K | $30K |
| Investment legal counsel | $5K | $10K | $15K | $25K | $35K |
| Marketing (HNW + advisors) | $25K | $60K | $120K | $200K | $300K |
| **Total** | **$73K** | **$145K** | **$265K** | **$438K** | **$645K** |

**Marketing spend detail:**
- Year 1 ($25K): Launch events (2 × $3K), advisor outreach ($5K), digital
  ads targeting $250K+ net worth ($10K), content ($7K)
- Year 3 ($120K): 10+ advisor partnerships ($30K referral fees), events
  ($20K), digital/print ($40K), content team ($30K)
- Year 5 ($300K): 20+ advisor partnerships ($80K), national events ($50K),
  digital/print ($100K), brand campaign ($70K)

#### P&L Summary — Active Growth

| Year | Revenue | Costs | Net | Margin |
|------|---------|-------|-----|--------|
| FY2027 | $9K | $73K | -$64K | N/A |
| FY2028 | $66K | $145K | -$79K | -120% |
| FY2029 | $267K | $265K | **$2K** | 1% |
| FY2030 | $866K | $438K | **$428K** | 49% |
| FY2031 | $2,214K | $645K | **$1,569K** | 71% |
| **Total** | **$3,422K** | **$1,566K** | **$1,856K** | 54% |

Breaks even in **Year 3**. 5-year cumulative net: **$1.86M**.

### Key Differences: Give vs DAF Revenue

| Characteristic | Give (Transaction Fees) | DAF (AUM Fees) |
|---------------|------------------------|----------------|
| Revenue type | Per-transaction (3.5%) | Recurring (0.75% of AUM) |
| Revenue timing | Immediate, seasonal | Continuous, compounds |
| Customer LTV | Low (donor may churn) | Very high (AUM is sticky) |
| Seasonality | Heavy (31% in December) | Minimal (AUM accrues steadily) |
| Capital intensity | Low (pass-through) | Moderate (compliance, investment program) |
| Margin at scale | ~50% | ~50-70% |
| Network effects | Moderate | Strong (larger fund = better investment terms) |

The DAF complements Give: Give captures high-volume, small-dollar
transactions; DAF captures high-value, long-term donor relationships. A
donor who gives $500/yr through Give generates ~$17.50 in platform fees.
The same donor opening a $25K DAF generates ~$187.50/yr in perpetuity —
10x the annual revenue, recurring indefinitely.

---

## 9. What's Not Modeled

These items are known gaps that could be added in future projections:

- **Staffing costs:** No headcount / salary projections (assumes founder-funded early stage)
- **Payment processor pass-through:** Stripe/Adyen fees are embedded in the platform fee, not broken out
- **Churn:** No user or charity partner attrition modeling
- **Currency risk:** CA entities' cloud costs are USD-denominated; no FX hedging modeled
- **Capital expenditure:** All costs modeled as OpEx (SaaS/cloud-native)
- **Tax implications:** No income tax, HST/GST, or SR&ED credit projections
- **Seasonality:** Donation patterns are seasonal (year-end spike); projections use annual averages distributed evenly across months
- **Intercompany transactions:** Related party fees, licensing, cost-sharing between the four entities not yet modeled
