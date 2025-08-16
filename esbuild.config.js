import esbuild from 'esbuild';
import { existsSync, mkdirSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist');
}

const isWatch = process.argv.includes('--watch');

// Common build options
const commonOptions = {
  entryPoints: ['src/index-new.js'],
  bundle: true,
  sourcemap: true,
  target: ['es2015'],
};

// Build configurations
const builds = [
  // ESM build (for modern bundlers and ES modules)
  {
    ...commonOptions,
    format: 'esm',
    outfile: 'dist/markdown-actions.esm.js',
  },
  // UMD build (for script tags and CommonJS)
  {
    ...commonOptions,
    format: 'iife',
    globalName: 'markdownActions',
    outfile: 'dist/markdown-actions.js',
  },
  // Minified UMD build
  {
    ...commonOptions,
    format: 'iife',
    globalName: 'markdownActions',
    outfile: 'dist/markdown-actions.min.js',
    minify: true,
    sourcemap: false,
  },
];

async function build() {
  if (isWatch) {
    console.log('👀 Watching for changes...');
    
    // Create contexts for watch mode
    const contexts = await Promise.all(
      builds.map(options => esbuild.context(options))
    );
    
    // Start watching
    await Promise.all(contexts.map(ctx => ctx.watch()));
    
    console.log('✅ Build complete. Watching for changes...');
  } else {
    console.log('🔨 Building...');
    
    // One-time build
    await Promise.all(
      builds.map(options => esbuild.build(options))
    );
    
    console.log('✅ Build complete!');
    console.log('📦 Output files:');
    console.log('  - dist/markdown-actions.esm.js (ESM)');
    console.log('  - dist/markdown-actions.js (UMD)');
    console.log('  - dist/markdown-actions.min.js (UMD, minified)');
  }
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});