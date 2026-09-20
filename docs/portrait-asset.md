# Portrait asset provenance

Asset: `img/portrait-directions.png`
Source: `img/jhun_profile.png`
Created with the built-in image-generation tool, not the API CLI. The generated views are approximations derived from a single photo.

Prompt: Create one identity-preserving 3 by 3 transparent photographic animation sprite atlas of the supplied smiling man in his cream barong. Columns look viewer-left, front and viewer-right; rows look up, level and down. Preserve face identity, smile, hairstyle, lighting, scale, neck position and stationary frontal body. No labels, gutters, borders, cartoon styling or text. Use realistic three-dimensional head turns instead of tilted flat photographs.

The generated framing differs from the requested original framing, so `portrait.js` crops and aligns the heads in the page. The original body remains stationary. The original photo is retained as the fallback for touch, reduced motion or a failed atlas load.
