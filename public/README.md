# Site assets

Ninja/weapon themed art is included for the site.

## Image files

- **hero.jpg** – Hero section on the home page (background of the title block).
  - Ninja silhouette with weapons (kunai, shuriken, katana) in dark theme
  - 1920x1080 aspect ratio, optimized for web
  - **Included:** Actual ninja/weapon hero image is present

- **bg-pattern.png** – Full-page background texture.
  - Subtle weapon silhouettes and ninja patterns
  - Low-contrast, optimized for performance
  - **Included:** Actual pattern image is present

## Mobile optimization

- Keep file sizes small for mobile performance
- Background images automatically use `scroll` attachment on mobile (instead of `fixed`) for better performance
- Images are loaded via CSS background-image, so they won't cause layout shift

## Fallback placeholders

SVG placeholders (`hero.jpg.svg` and `bg-pattern.png.svg`) are available if you need to replace the images. The site uses the actual hero.jpg and bg-pattern.png by default.

After adding or replacing files, rebuild and redeploy.
