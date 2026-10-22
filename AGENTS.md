<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## FloodPulse architecture
- Dataset is the uploaded CSV served from public/data and parsed client-side in src/lib/dataset-context.tsx; never generate replacement data — on failure show the upload/error state.
- All calculations (aggregates, factor explanations, scenarios) live in src/lib/floodpulse.ts and must be labelled as calculated, distinct from original values.
- Leaflet is loaded only client-side via React.lazy (src/components/RiskMap.tsx) because it touches window at import.
