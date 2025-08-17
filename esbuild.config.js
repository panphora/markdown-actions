import esbuild from 'esbuild';
import { existsSync, mkdirSync } from 'fs';

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist');
}

const isWatch = process.argv.includes('--watch');

// Common build options
const commonOptions = {
  entryPoints: ['src/index.js'],
  bundle: true,
  sourcemap: true,
  target: ['es2015'],
};

// Build configurations
const builds = [
  // ESM build (for modern bundlers and ES modules - keeps debug for development)
  {
    ...commonOptions,
    format: 'esm',
    outfile: 'dist/markdown-actions.esm.js',
    define: {
      'process.env.NODE_ENV': '"development"'
    }
  },
  // UMD build (for script tags and CommonJS - keeps debug for development)
  {
    ...commonOptions,
    format: 'iife',
    globalName: 'markdownActions',
    outfile: 'dist/markdown-actions.js',
    define: {
      'process.env.NODE_ENV': '"development"'
    }
  },
  // Minified UMD build (production - strips debug)
  {
    ...commonOptions,
    format: 'iife',
    globalName: 'markdownActions',
    outfile: 'dist/markdown-actions.min.js',
    minify: true,
    sourcemap: false,
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    drop: ['debugger', 'console']
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