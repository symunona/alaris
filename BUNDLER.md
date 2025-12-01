# Vendor Bundler

Simple script to concatenate and minify vendor libraries from `node_modules` and local `public/js/lib/vendor` into bundled files.

## Features

- Concatenates multiple vendor files into single bundles
- Minifies JavaScript using Terser (typically 40-45% size reduction)
- Minifies CSS using clean-css (typically 10% size reduction)
- Copies required assets (Trumbowyg SVG icons)
- Optional watch mode for development

## Usage

### Build vendor bundles once
```bash
npm run build:vendor
```

### Build all (vendor + weeks)
```bash
npm run build
```

### Watch mode (auto-rebuild on changes)
```bash
node bundle-vendor.js --watch
```

## Output

The bundler creates the following minified files in `public/dist/`:

- **vendor-base.js** (~191 KB) - jQuery, debounce, highlight, moment (used in index.jade)
- **vendor-admin.js** (~140 KB) - Trumbowyg, jQuery UI, Dropzone, Bootstrap modal/util (used in index.jade when admin)
- **vendor-admin-css.css** (~43 KB) - CSS for Trumbowyg, jQuery UI, Dropzone (used in index.jade when admin)
- **vendor-stats.js** (~358 KB) - jQuery, debounce, highlight, knockout, moment, Chart.js (used in stat.jade)
- **icons.svg** (~30 KB) - Trumbowyg SVG icons sprite (required for editor toolbar icons)

## Configuration

Edit `bundle-vendor.js` to modify which files are included in each bundle.

The bundles are defined in:
- `bundles` object for JavaScript files
- `cssBundle` object for CSS files

### Minification Settings

**JavaScript (Terser):**
- Dead code elimination enabled
- Console statements preserved (drop_console: false)
- Debugger statements removed
- Class and function names preserved (for compatibility)
- No variable mangling (mangle: false)
- Comments removed

**CSS (clean-css):**
- Level 2 optimization (restructuring enabled)
- Removes whitespace, comments, and optimizes selectors

## Integration

The following templates have been updated to use bundled files:
- **index.jade** - Uses `vendor-base.js` and `vendor-admin.js` (+ CSS when admin)
- **stat.jade** - Uses `vendor-stats.js`

All individual script/link tags for vendor libraries have been replaced with single bundled file references.

### Trumbowyg SVG Icons

The bundler automatically copies `icons.svg` from `node_modules/trumbowyg/dist/ui/` to `public/dist/`.

The SVG path is configured in `public/js/admin.js`:
```javascript
$.trumbowyg.svgPath = '/dist/icons.svg';
```

This ensures the WYSIWYG editor toolbar icons display correctly.
