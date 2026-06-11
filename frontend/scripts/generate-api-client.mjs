import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const specPath = resolve(process.cwd(), '../docs/openapi.json')
const outPath = resolve(process.cwd(), 'src/lib/generated-api.ts')
const spec = JSON.parse(readFileSync(specPath, 'utf8'))

const operations = []
for (const [path, methods] of Object.entries(spec.paths || {})) {
  for (const [method, operation] of Object.entries(methods || {})) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
    operations.push({
      method: method.toUpperCase(),
      path,
      operationId: operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
    })
  }
}

operations.sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`))

const endpointUnion = operations.map((op) => `  | '${op.path}'`).join('\n') || '  | never'
const operationUnion = operations.map((op) => `  | '${op.method} ${op.path}'`).join('\n') || '  | never'
const seenOperationIds = new Map()
const uniqueOperationId = (operationId, method, path) => {
  const count = seenOperationIds.get(operationId) || 0
  seenOperationIds.set(operationId, count + 1)
  if (count === 0) return operationId
  return `${operationId}_${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
}

const mapEntries = operations
  .map((op) => {
    const id = uniqueOperationId(op.operationId, op.method, op.path)
    return `  '${id}': { method: '${op.method}', path: '${op.path}' },`
  })
  .join('\n')

const content = `// Auto-generated from docs/openapi.json. Do not edit manually.\n\nexport type ApiEndpoint =\n${endpointUnion}\n\nexport type ApiOperation =\n${operationUnion}\n\nexport const apiOperations = {\n${mapEntries}\n} as const\n\nexport type ApiOperationId = keyof typeof apiOperations\n`

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, content)
console.log(`Generated ${operations.length} API operations: ${outPath}`)
