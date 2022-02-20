#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import deepmerge from 'deepmerge'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

// Currently used configuration.
let config

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
}

/**
 * Rebuild documentation.
 */
async function buildAll() {
  for (const name of Object.keys(config.repositories)) {
    await fetch(name)
  }
}

async function main() {
  config = readConfig(process.cwd())
  if (!config.buildDir) {
    config.buildDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build')
  }
  await buildAll()
}

await main()
