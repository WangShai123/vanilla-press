import { execFile } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import process from 'process'
import readline from 'readline/promises'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const templateRoot = path.join(packageRoot, 'template')
const templateDirectories = ['assets', 'docs', 'vp']
const templateFiles = ['README.md']
const projectGitignore = `node_modules
dist
vp/cache
`
const execFileAsync = promisify(execFile)

function write(output, text) {
  output.write(text)
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function printHelp() {
  process.stdout.write(
    'Usage: npm create vanilla-press@latest [project-name] [-- --force]\n'
  )
}

function isForceEnabled(args = []) {
  return args.includes('--force') || args.includes('-f')
}

function resolveProjectName(rawName, targetDir) {
  const fallback = path.basename(targetDir)
  const baseName =
    rawName && rawName !== '.' ? path.basename(rawName) : fallback
  const name = String(baseName || fallback).trim()
  return name || 'vanilla-press-docs'
}

function toPackageName(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'vanilla-press-docs'
  )
}

function toSiteName(name) {
  return (
    name
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ') || 'VanillaPress'
  )
}

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function ensureTargetDir(targetDir, force) {
  if (!(await pathExists(targetDir))) {
    await fs.mkdir(targetDir, { recursive: true })
    return
  }

  const entries = await fs.readdir(targetDir)
  if (!entries.length) return
  if (force) return

  throw new Error(`Target directory is not empty: ${targetDir}`)
}

async function copyDirectory(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true })
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name)
    const target = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(source, target)
      continue
    }

    await fs.copyFile(source, target)
  }
}

async function copyTemplate(targetDir) {
  await Promise.all(
    templateDirectories.map((dir) =>
      copyDirectory(path.join(templateRoot, dir), path.join(targetDir, dir))
    )
  )

  await Promise.all(
    templateFiles.map((file) =>
      fs.copyFile(path.join(templateRoot, file), path.join(targetDir, file))
    )
  )
}

async function writeGitignore(targetDir) {
  await fs.writeFile(path.join(targetDir, '.gitignore'), projectGitignore)
}

function yes(value) {
  return /^(?:y|yes)$/i.test(String(value || '').trim())
}

async function confirmGitInit(input = process.stdin, output = process.stdout) {
  if (!input.isTTY || !output.isTTY) return false

  const rl = readline.createInterface({ input, output })
  try {
    const answer = await rl.question('Initialize a git repository? (y/N) ')
    return yes(answer)
  } finally {
    rl.close()
  }
}

async function initGit(targetDir) {
  await execFileAsync('git', ['init', '--quiet'], { cwd: targetDir })
  await writeGitignore(targetDir)
}

async function maybeInitGit(targetDir, options = {}) {
  const result = {
    requested: false,
    initialized: false,
    warning: '',
  }

  if (options.git === true) {
    result.requested = true
  } else if (options.git === false) {
    return result
  } else {
    result.requested = await confirmGitInit(options.input, options.output)
  }

  if (!result.requested) return result

  try {
    await initGit(targetDir)
    result.initialized = true
  } catch (error) {
    result.warning = `Git initialization failed: ${error.message}`
  }

  return result
}

function printCompletion(result, output = process.stdout) {
  write(output, `\nVanillaPress project created in ${result.relativeDir}\n`)

  if (result.git.initialized) {
    write(output, 'Git repository initialized and .gitignore added.\n')
  } else if (result.git.warning) {
    write(output, `${result.git.warning}\n`)
  }

  write(output, 'Next steps:\n')
  if (result.relativeDir !== '.') {
    write(output, `  cd ${result.relativeDir}\n`)
  }
  write(output, '  npm install\n')
  write(output, '  npm run dev\n')
}

async function loadSourcePackage() {
  const packageJson = await fs.readFile(
    path.join(packageRoot, 'package.json'),
    'utf8'
  )
  return JSON.parse(packageJson)
}

function createProjectPackage(sourcePackage, projectName) {
  return {
    name: toPackageName(projectName),
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      build: 'vanilla-press build',
      dev: 'vanilla-press dev',
    },
    devDependencies: {
      'vanilla-press': `^${sourcePackage.version}`,
    },
    allowScripts: {
      esbuild: true,
    },
  }
}

async function writeProjectPackage(targetDir, projectName) {
  const sourcePackage = await loadSourcePackage()
  const projectPackage = createProjectPackage(sourcePackage, projectName)
  const output = `${JSON.stringify(projectPackage, null, 2)}\n`

  await fs.writeFile(path.join(targetDir, 'package.json'), output, 'utf8')
}

async function rewriteConfig(targetDir, projectName) {
  const configFile = path.join(targetDir, 'vp', 'config', 'runtime.ts')
  const config = await fs.readFile(configFile, 'utf8')
  const next = config.replace(
    /siteName:\s*["']VanillaPress["']/,
    `siteName: ${JSON.stringify(toSiteName(projectName))}`
  )

  await fs.writeFile(configFile, next, 'utf8')
}

export async function scaffoldProject(rawTarget = '.', options = {}) {
  const force = Boolean(options.force)
  const cwd = options.cwd || process.cwd()
  const targetDir = path.resolve(cwd, rawTarget)
  const projectName = resolveProjectName(
    rawTarget === '.' ? '' : rawTarget,
    targetDir
  )

  await ensureTargetDir(targetDir, force)
  await copyTemplate(targetDir)
  await writeProjectPackage(targetDir, projectName)
  await rewriteConfig(targetDir, projectName)
  const git = await maybeInitGit(targetDir, options)
  const relativeDir = toPosix(path.relative(cwd, targetDir) || '.')

  const result = {
    targetDir,
    relativeDir,
    projectName,
    git,
  }

  printCompletion(result, options.output || process.stdout)
  return result
}

export async function runScaffoldCli(args = [], options = {}) {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }

  const force = isForceEnabled(args)
  const rawTarget = args.find((arg) => !arg.startsWith('-')) || '.'

  await scaffoldProject(rawTarget, {
    cwd: options.cwd,
    force,
    input: options.input,
    output: options.output,
  })
}
