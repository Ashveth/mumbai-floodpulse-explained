# FloodPulse Mumbai

**An explainable urban flood-risk prototype for Mumbai**

[Open the live demo](https://mumbaifloods.vercel.app/) · [View the source](https://github.com/Ashveth/mumbai-floodpulse-explained)

> The deck calls the intended project **FloodPulse Mumbai**. The current interactive app is branded **Mumbai FloodPulse**. This repository documents the working prototype and separates it from planned features.

## Project overview

FloodPulse is designed for municipal ward control-room teams that need to understand where rain-related pressure may be building, why an area is being prioritized, and how a hypothetical change in rainfall could alter the picture.

The current web app demonstrates that workflow with an interactive dashboard, map, location profiles, rainfall analysis, and scenario controls. It is a prototype for exploring the interface and data flow—not a live flood-warning service or a validated prediction model.

## What you can try

- **Overview:** inspect demo record counts, location categories, and rainfall trends.
- **Flood Map:** filter by date, location, rainfall window, risk category, and minimum rainfall; select a marker to open its record.
- **Location profile:** compare demo scores, rainfall, illustrative score factors, and preparedness prompts.
- **Rainfall analysis:** explore synthetic 1-hour, 24-hour, and 72-hour rainfall patterns.
- **What If?:** apply rainfall presets or custom changes and see how illustrative score categories and the ranked list shift. Export the scenario priorities as CSV.
- **Data Explorer:** inspect and quality-check the bundled CSV, or load another CSV in the browser.
- **Stay Safe:** view general monsoon safety guidance and helplines.
- **Methodology & About:** read the scoring logic, data dictionary, sources, and limitations.

The interface supports English, Hindi, and Marathi.

## Current data and limitations

The default dataset is [public/data/floodpulse_demo.csv](public/data/floodpulse_demo.csv). It contains **750 generated location-day rows** for **25 approximate demo grid locations** from **2025-07-01 to 2025-07-30**.

The records are synthetic or illustrative. This includes rainfall, incident counts, elevation, drainage proxies, scores, and risk categories. Coordinates are approximate and are not official ward boundaries. There are no verified observed-flood labels.

As a result:

- Risk scores are **not flood probabilities**.
- The app does **not** provide real-time or validated flood predictions.
- The scenario planner is a **sensitivity illustration**, not a forecast. It changes synthetic 24-hour rainfall while holding other factors constant.
- No accuracy, precision, recall, or forecast-validation results are claimed.
- Preparedness prompts are illustrative and are not operational instructions.

The candidate public datasets shown in the app are possible future sources; they are **not** the provenance of the bundled synthetic CSV. See [src/data/datasetPack.json](src/data/datasetPack.json) for the dataset dictionary and caveats.

## How the demo calculates results

The supplied dataset defines an illustrative score using weighted indicators: 45% synthetic rainfall, 25% synthetic incident count, 20% synthetic terrain, and 10% inverse synthetic drainage coverage, plus small generated noise. The score is not calibrated against flood events.

For a scenario, the app scales or adds to synthetic 24-hour rainfall, then adjusts the original demo score using the dataset's 24-hour rainfall range. Other factors stay fixed and the result is clamped to 0–100. This helps demonstrate how a scenario interface behaves; it does not estimate what would happen during a real storm.

The app parses the CSV in the browser, checks the expected columns, and reports missing values, duplicate IDs, and invalid coordinates. Invalid coordinates are excluded from the map rather than repositioned. Aggregates and explanations are calculated from the loaded rows and labelled as calculated.

## Run locally

### Requirements

- [Bun](https://bun.sh/) (recommended; the repository includes bun.lock)
- Internet access for OpenStreetMap map tiles

The bundled CSV is included in the repository. The core dashboard does not call a live weather or flood API.

~~~sh
git clone https://github.com/Ashveth/mumbai-floodpulse-explained.git
cd mumbai-floodpulse-explained
bun install
bun run dev
~~~

Open the local URL printed by Vite.

~~~sh
bun run test
bun run lint
bun run build
bun run preview
~~~

The project also contains a Lovable-generated Supabase integration. If you use Supabase-backed server functions locally, configure the required Supabase values in an untracked .env.local file. Do not commit private credentials.

## CSV format

The demo parser expects these fields:

~~~text
record_id
location_id
location_name_demo
date
latitude_approx
longitude_approx
rain_1h_mm_synthetic
rain_24h_mm_synthetic
rain_72h_mm_synthetic
historical_incident_count_synthetic
elevation_m_synthetic_demo
drainage_coverage_proxy_synthetic
risk_score_0_100_demo
risk_level_demo
observed_flood_label
data_status
~~~

Keep the provenance field attached to each row. For the bundled dataset, data_status is SYNTHETIC_DEMO_ONLY and observed_flood_label is NOT_AVAILABLE. Loading a CSV does not make its values verified.

## Project structure

~~~text
public/data/floodpulse_demo.csv       Bundled synthetic demo dataset
src/data/datasetPack.json             Data dictionary and limitations
src/routes/                           Dashboard pages and file-based routes
src/lib/floodpulse.ts                 Parsing, aggregation, scoring, scenarios
src/lib/dataset-context.tsx           Client-side dataset loading
src/components/RiskMap.tsx            Interactive Leaflet map
src/test/                             Vitest tests
~~~

## Planned direction

The intended FloodPulse concept goes beyond the current demo. Planned work includes:

1. Replace approximate demo locations with documented Mumbai ward boundaries and sourced data.
2. Build and evaluate next-24-hour rainfall and PM2.5 estimates against a persistence baseline using chronological holdouts.
3. Show uncertainty, key drivers, and sensor-coverage limitations with each estimate.
4. Add a ward-level response simulation that considers available pumps and crews.

These are roadmap items, not capabilities of the current deployed app. Real operational use would require reliable source data, verified event labels, validation, and review by the relevant authorities.

## Safety and official alerts

This is a student hackathon prototype, not an official warning system. For real-time guidance, follow [BMC Disaster Management](https://dm.mcgm.gov.in/) and the [India Meteorological Department](https://mausam.imd.gov.in/).

Map tiles are provided by OpenStreetMap. © OpenStreetMap contributors.

## License

No code license is currently included in this repository. Do not assume the source code is licensed for reuse until a LICENSE file is added. The generated synthetic demo data may be reused for prototyping; any real data added later must follow its own licence and attribution terms.
