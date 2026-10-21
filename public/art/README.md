# V0.5 original environment atlas

`tactical-maps.webp` is an original environment asset generated specifically for FPS 主播模拟器 in this development session. It is not the user-provided concept sheet and contains no game UI, characters, weapons, logos, or copied commercial-game screenshot.

The single 1024 × 1536 atlas has three equal panoramic bands:

1. **曦光旧城**: fictional coastal sandstone town, archways, bell tower, vines and tactical cover.
2. **蓝隙通道**: fictional industrial cargo transit hall, gantries, blue lighting and amber doors.
3. **晴湾交火区**: fictional futuristic harbor courtyard, containers and elevated walkways.

Generated source was retained outside the checkout in `/workspace/generated_images/`. The repository includes only the WebP delivery asset, encoded at quality 86 (about 426 KiB). No source image was painted over or cut out from the reference concept. The same atlas is reused for scene backgrounds, map selection and tactic cards.

SVG weapons, portraits and combat characters are authored in `src/components/`; the effects and UI are rendered separately. Scene art is decorative; interactive controls and all gameplay state remain real Vue components. Art direction: original sunlit/industrial tactical environments, realistic materials and depth, cool midnight broadcast panels with rose/cyan accents.
