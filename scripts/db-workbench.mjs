import 'dotenv/config'
import { spawn, execFileSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || '3307'
const DB_USER = process.env.DB_USER || 'vizinho_app'
const DB_PASS = process.env.DB_PASS || 'vizinho123'
const DB_NAME = process.env.DB_NAME || 'vizinho'

const WORKBENCH_BIN = '/Applications/MySQLWorkbench.app/Contents/MacOS/MySQLWorkbench'

function ensureDbRunning() {
  const pidFile = path.join(ROOT, 'mysql-data', 'mysqld.pid')
  if (fs.existsSync(pidFile)) {
    try {
      const pid = Number(fs.readFileSync(pidFile, 'utf8'))
      if (pid && process.kill(pid, 0)) return
    } catch {}
  }
  console.log('→ Iniciando MySQL...')
  execFileSync('node', [path.join(__dirname, 'db-start.mjs')], { stdio: 'inherit' })
}

function openWorkbench(connectionString) {
  if (!fs.existsSync(WORKBENCH_BIN)) {
    console.error('❌ MySQL Workbench não encontrado em:')
    console.error(`   ${WORKBENCH_BIN}`)
    console.error('   Instale em: https://dev.mysql.com/downloads/workbench/')
    process.exit(1)
  }

  console.log('→ Abrindo MySQL Workbench...')
  const child = spawn(WORKBENCH_BIN, ['--query', connectionString], { stdio: 'ignore', detached: true })
  child.unref()
}

ensureDbRunning()

const user = encodeURIComponent(DB_USER)
const pass = encodeURIComponent(DB_PASS)
const connectionString = `mysql://${user}:${pass}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

openWorkbench(connectionString)

console.log(`\n✅ MySQL Workbench conectado em ${DB_HOST}:${DB_PORT} (${DB_NAME})`)