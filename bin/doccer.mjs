#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import deepmerge from 'deepmerge'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

// Currently used configuration.
let config = {
  workDir: null,
  buildDir: null,
  outDir: null,
  title: '',
  repositories: {},
}

// Base configuration for Typescript.
const TS_CONFIG = {
  "compilerOptions": {
      "target": "es2020",
      "module": "commonjs",
      "esModuleInterop": true,
      "strictNullChecks": true,
      "moduleResolution": "node",
      "declaration": true,
      "skipLibCheck": true,
      "outDir": "./dist",
      "sourceMap": true
  },
  "include": [
  ]
}

// Base configuration for Typedoc.
const TYPEDOC_CONFIG = {
  "out": null,
  "entryPoints": [],
  "readme": null,
  "name": null,
}

/**
 * A logger function.
 * @param args
 */
function log(...args) {
  console.log(new Date(), ...args)
}

/**
 * Collect all file paths matching the file name found, when ascending in the directory structure.
 * @param startDir
 * @param fileName
 */
function pathsFound(startDir, fileName) {
  const filePath = path.join(startDir, fileName)
  let result = []
  if (fs.existsSync(filePath)) {
    result.push(filePath)
  }
  const parentDir = path.dirname(startDir)
  if (parentDir !== startDir) {
    result = result.concat(pathsFound(parentDir, fileName))
  }
  return result.reverse()
}

/**
 * Read the configuration for the project.
 */
function readConfig(dir) {
  let conf = {}
  for (const confPath of pathsFound(dir, 'doccer.json')) {
    conf = deepmerge(conf, JSON.parse(fs.readFileSync(confPath).toString('utf-8')))
  }
  conf.workDir = dir
  return conf
}

/**
 * Run the shell command.
 * @param command
 */
async function system(command) {
  log("Running:", command)
  return new Promise((resolve, reject) => {
    let out = ''
    const proc = spawn(command, { shell: true })

    proc.stdout.on('data', (data) => {
      out += data
      process.stdout.write(data)
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(data)
    })

    proc.on('close', (code) => {
      if (code) {
        reject(new Error(`Failed with code ${code}.`))
      } else {
        resolve(out)
      }
    })
  })
}

/**
 * Fetch the repository for documentation building.
 * @param name
 */
async function fetch(name) {
  log(`Fetching repository ${name} to ${config.buildDir}`)
  const destDir = path.join(config.buildDir, name)
  if (fs.existsSync(destDir)) {
    await system(`cd "${config.buildDir}/${name}" && git pull`)
  } else {
    await system(`cd "${config.buildDir}" && git clone "${config.repositories[name].git}"`)
  }
  await system(`cd "${config.buildDir}/${name}" && yarn install`)
}

/**
 * Save a json config file.
 * @param filePath
 * @param json
 */
function saveJson(filePath, json) {
  const jsonPath = path.join(config.buildDir, filePath)
  log('Saving', jsonPath)
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
}

/**
 * Create configuration for typescript.
 */
 function makeTsConfig() {
  let include = []
  Object.keys(config.repositories).forEach(name => {
    include = include.concat(config.repositories[name].include.map(i => `${name}/${i}`))
  })
  const tsConf = {...TS_CONFIG, include}
  saveJson('tsconfig.json', tsConf)
}

/**
 * Create configuration for typedoc.
 */
 function makeTypedocConfig() {
  let entryPoints = []
  Object.keys(config.repositories).forEach(name => {
    entryPoints = entryPoints.concat(config.repositories[name].include.map(i => `${name}/${i}`))
  })
  const typedocConf = {...TYPEDOC_CONFIG, entryPoints, out: config.outDir}
  const readmes = pathsFound(config.workDir, 'DOCCER-INDEX.md')
  if (readmes.length) {
    typedocConf.readme = readmes.pop()
  }
  typedocConf.name = config.title || 'No Title'
  saveJson('typedoc.json', typedocConf)
}

/**
 * Run document build command.
 */
async function compile() {
  let include = []
  Object.keys(config.repositories).forEach(name => {
    include = include.concat(config.repositories[name].include.map(i => `${name}/${i}`))
  })
  await system(`cd "${config.buildDir}" && npx typedoc`)
}

/**
 * Rebuild documentation.
 */
async function buildAll() {
  for (const name of Object.keys(config.repositories)) {
    await fetch(name)
  }
  makeTsConfig()
  makeTypedocConfig()
  await compile()
}

/**
 * Main program.
 */
async function main() {
  config = readConfig(process.cwd())
  if (!config.buildDir) {
    config.buildDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build')
  }
  if (!config.outdDir) {
    config.outDir = path.join(config.buildDir, 'output')
  }
  log('Configuration')
  console.dir(config, { depth: null })
  await buildAll()
}

await main()
