#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const WATCH_MODE = process.argv.includes('--watch');

// Define vendor bundles
const bundles = {
  'vendor-base': [
    'public/js/lib/vendor/jquery-1.11.0.js',
    'public/js/lib/vendor/jquery.debounce-1.0.5.js',
    'public/js/lib/vendor/jquery.highlight.js',
    'node_modules/moment/min/moment.min.js'
  ],
  'vendor-admin': [
    'node_modules/trumbowyg/dist/trumbowyg.min.js',
    'public/js/lib/vendor/jqueryui/js/jquery-ui-1.10.4.custom.min.js',
    'node_modules/dropzone/dist/min/dropzone.min.js',
    'node_modules/bootstrap/js/dist/util.js',
    'node_modules/bootstrap/js/dist/modal.js'
  ],
  'vendor-stats': [
    'public/js/lib/vendor/jquery-1.11.0.js',
    'public/js/lib/vendor/jquery.debounce-1.0.5.js',
    'public/js/lib/vendor/jquery.highlight.js',
    'public/js/lib/vendor/knockout-3.0.0.debug.js',
    'public/js/lib/vendor/knockout.wrap.js',
    'public/js/lib/vendor/inheritance.js',
    'node_modules/moment/min/moment.min.js',
    'public/js/lib/vendor/chartjs/Chart.js'
  ]
};

const cssBundle = {
  'vendor-admin-css': [
    'node_modules/trumbowyg/dist/ui/trumbowyg.css',
    'public/js/lib/vendor/jqueryui/css/ui-darkness/jquery-ui-1.10.4.custom.min.css',
    'node_modules/dropzone/dist/min/dropzone.min.css'
  ]
};

const outputDir = path.join(__dirname, 'public', 'dist');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function buildBundles() {
  // Copy Trumbowyg SVG icons
  const trumbowygIconsSrc = path.join(__dirname, 'node_modules/trumbowyg/dist/ui/icons.svg');
  const trumbowygIconsDest = path.join(outputDir, 'icons.svg');
  if (fs.existsSync(trumbowygIconsSrc)) {
    fs.copyFileSync(trumbowygIconsSrc, trumbowygIconsDest);
    console.log(`✓ Copied Trumbowyg icons.svg to ${trumbowygIconsDest}\n`);
  } else {
    console.warn(`! Trumbowyg icons.svg not found at ${trumbowygIconsSrc}\n`);
  }

  // Bundle JavaScript files
  for (const [name, files] of Object.entries(bundles)) {
  console.log(`Building ${name}.js...`);
  let combined = '';
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`  + ${file}`);
      combined += fs.readFileSync(filePath, 'utf8') + '\n';
    } else {
      console.warn(`  ! Missing: ${file}`);
    }
  });
  
  const outputPath = path.join(outputDir, `${name}.js`);
  const originalSize = combined.length;
  
  // Minify the combined JavaScript
  try {
    const result = await minify(combined, {
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        keep_classnames: true,
        keep_fnames: true
      },
      mangle: false,
      format: {
        comments: false
      }
    });
    
    const minified = result.code || combined;
    fs.writeFileSync(outputPath, minified);
    console.log(`✓ Created ${outputPath}`);
    console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB → Minified: ${(minified.length / 1024).toFixed(2)} KB (${((1 - minified.length / originalSize) * 100).toFixed(1)}% reduction)\n`);
  } catch (err) {
    console.warn(`  ! Minification failed, using unminified version: ${err.message}`);
    fs.writeFileSync(outputPath, combined);
    console.log(`✓ Created ${outputPath} (${(combined.length / 1024).toFixed(2)} KB)\n`);
  }
  }

  // Bundle CSS files
  for (const [name, files] of Object.entries(cssBundle)) {
  console.log(`Building ${name}.css...`);
  let combined = '';
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`  + ${file}`);
      combined += fs.readFileSync(filePath, 'utf8') + '\n';
    } else {
      console.warn(`  ! Missing: ${file}`);
    }
  });
  
  const outputPath = path.join(outputDir, `${name}.css`);
  const originalSize = combined.length;
  
  // Minify the combined CSS
  try {
    const cleanCss = new CleanCSS({
      level: 2,
      returnPromise: false
    });
    const result = cleanCss.minify(combined);
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.join(', '));
    }
    
    const minified = result.styles;
    fs.writeFileSync(outputPath, minified);
    console.log(`✓ Created ${outputPath}`);
    console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB → Minified: ${(minified.length / 1024).toFixed(2)} KB (${((1 - minified.length / originalSize) * 100).toFixed(1)}% reduction)\n`);
  } catch (err) {
    console.warn(`  ! Minification failed, using unminified version: ${err.message}`);
    fs.writeFileSync(outputPath, combined);
    console.log(`✓ Created ${outputPath} (${(combined.length / 1024).toFixed(2)} KB)\n`);
  }
  }

  console.log('Bundle complete!');
}

// Run the build
buildBundles().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

if (WATCH_MODE) {
  console.log('\nWatching for changes...');
  const allFiles = [
    ...Object.values(bundles).flat(),
    ...Object.values(cssBundle).flat()
  ].map(f => path.join(__dirname, f));
  
  allFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.watch(file, () => {
        console.log(`\n${file} changed, rebuilding...`);
        // Re-run the bundling (simplified - just rebuild all)
        setTimeout(() => {
          require('child_process').execSync('node bundle-vendor.js', { stdio: 'inherit' });
        }, 100);
      });
    }
  });
}
