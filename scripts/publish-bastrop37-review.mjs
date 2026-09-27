import { cp, readFile, writeFile } from 'node:fs/promises';

// Publish the isolated review without importing it into the production game.
const source = new URL('../docs/bastrop37/phase2/', import.meta.url);
const destination = new URL('../dist/docs/bastrop37/phase2/', import.meta.url);
await cp(source, destination, { recursive: true });

// The repository preview includes public/ in paths; Astro serves its contents at /.
for (const file of ['preview.js', 'assets/asset-review.html']) {
  const path = new URL(file, destination);
  const content = await readFile(path, 'utf8');
  await writeFile(path, content.replace(/(?:\.\.\/)+public\/bastrop37\//g, '/bastrop37/'));
}
console.log('Published isolated Bastrop37 review at /docs/bastrop37/phase2/');
