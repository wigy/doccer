#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import deepmerge from 'deepmerge'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

// Currently used configuration.
let config

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

/**
 * A logger function.
 * @param args
 */
function log(...args) {
  console.log(new Date(), ...args)
}

/**
 * Read the configuration for the project.
 */
function readConfig(dir) {
  const confPath = path.join(dir, 'doccer.json')
  let conf = {}
  if (fs.existsSync(confPath)) {
    conf = JSON.parse(fs.readFileSync(confPath).toString('utf-8'))
  }
  const parentDir = path.dirname(dir)
  if (parentDir !== dir) {
    const parentConf = readConfig(parentDir)
    conf = deepmerge(parentConf, conf)
  }
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
 * Run document build command.
 */
async function compile() {
  let include = []
  Object.keys(config.repositories).forEach(name => {
    include = include.concat(config.repositories[name].include.map(i => `${name}/${i}`))
  })
  await system(`cd "${config.buildDir}" && npx typedoc --out "${config.outDir}" ${include.join(' ')}`)
}

/**
 * Rebuild documentation.
 */
async function buildAll() {
  for (const name of Object.keys(config.repositories)) {
    await fetch(name)
  }
  makeTsConfig()
  await compile()
}

async function main() {
  config = readConfig(process.cwd())
  if (!config.buildDir) {
    config.buildDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build')
  }
  if (!config.outdDir) {
    config.outDir = path.join(config.buildDir, 'output')
  }
  await buildAll()
}

await main()
