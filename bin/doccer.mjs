#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import deepmerge from 'deepmerge'

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

async function main() {
  const conf = readConfig(process.cwd())
  console.log(conf);
}

await main()
