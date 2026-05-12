import { accessSync, constants } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const required = [
  'firebase/package.json',
  'date-fns/package.json',
  '@google/generative-ai/package.json',
  'react-router-dom/package.json',
]

let missing = false
for (const rel of required) {
  try {
    accessSync(join(root, 'node_modules', rel), constants.F_OK)
  } catch {
    missing = true
    console.error(`Missing: node_modules/${rel}`)
  }
}

if (missing) {
  console.error(
    '\nDependencies are not installed (or install failed partway).\n' +
      'From this folder run:\n' +
      '  npm install\n' +
      'If that failed before: free disk space, delete node_modules and package-lock.json, then npm install again.\n',
  )
  process.exit(1)
}
