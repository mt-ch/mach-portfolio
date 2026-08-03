# Single `production` Sanity dataset

Sanity supports multiple datasets (e.g. `production` + `development`) so content changes can be drafted and tested before reaching the live site. We chose a single `production` dataset instead: the site has exactly one editor (the owner), so the failure mode a second dataset guards against — someone else's bad edit going live — doesn't apply, and content mistakes are cheap to fix in place. A reader familiar with typical Sanity setups might expect a dev/prod split; this was a deliberate simplification, not an oversight.
