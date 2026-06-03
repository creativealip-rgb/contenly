import { bundle } from '@remotion/bundler';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log('📦 Bundling Remotion compositions...');

  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, './src/index.ts'),
    outDir: path.resolve(__dirname, './dist/bundle'),
  });

  console.log(`✅ Bundle created at: ${bundleLocation}`);
}

build().catch((err) => {
  console.error('❌ Bundle failed:', err);
  process.exit(1);
});
