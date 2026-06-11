import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';

const srcRoot = resolve(process.cwd(), 'src');
const outPath = resolve(process.cwd(), '../docs/openapi.json');
const methods = ['Get', 'Post', 'Put', 'Patch', 'Delete'] as const;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith('.controller.ts') ? [path] : [];
  });
}

function cleanPath(path?: string): string {
  if (!path) return '';
  return path.replace(/^['"`]|['"`]$/g, '').replace(/^\//, '').replace(/\/$/, '');
}

function toOpenApiPath(path: string): string {
  return `/${path}`.replace(/\/+/g, '/').replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

const paths: Record<string, Record<string, Record<string, unknown>>> = {};

for (const file of walk(srcRoot)) {
  const source = readFileSync(file, 'utf8');
  const controllerMatch = source.match(/@Controller\(([^)]*)\)/);
  const basePath = cleanPath(controllerMatch?.[1]?.trim());
  const tag = basePath.split('/')[0] || 'default';

  for (const methodName of methods) {
    const regex = new RegExp(`@${methodName}\\(([^)]*)\\)[\\s\\S]*?(?:async\\s+)?([A-Za-z0-9_]+)\\s*\\(`, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      const routePath = cleanPath(match[1]?.trim());
      const operationId = match[2];
      const fullPath = toOpenApiPath(['api/v1', basePath, routePath].filter(Boolean).join('/'));
      const method = methodName.toLowerCase();
      paths[fullPath] ||= {};
      paths[fullPath][method] = {
        operationId,
        tags: [tag],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Internal Server Error' },
        },
      };
    }
  }
}

const document = {
  openapi: '3.0.0',
  info: {
    title: 'Contently API',
    description: 'Generated baseline contract from Nest controllers.',
    version: '1.0.0',
  },
  paths: Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b))),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`);
console.log(`OpenAPI baseline generated: ${outPath}`);
console.log(`Paths: ${Object.keys(paths).length}`);
