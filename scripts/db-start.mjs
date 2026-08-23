import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const MYSQL_BIN = process.env.MYSQL_BIN || '/usr/local/mysql/bin/mysqld'
const DATADIR = path.join(ROOT, 'mysql-data')
const SOCKET = path.join(DATADIR, 'mysql.sock')
const PID_FILE = path.join(DATADIR, 'mysqld.pid')
const LOG_FILE = path.join(DATADIR, 'mysqld.log')
const PORT = process.env.DB_PORT || '3307'

function isRunning() {
  if (!fs.existsSync(PID_FILE)) return false
  const pid = Number(fs.readFileSync(PID_FILE, 'utf8'))
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

if (isRunning()) {
  console.log('MySQL já está rodando.')
  process.exit(0)
}

if (!fs.existsSync(path.join(DATADIR, 'mysql'))) {
  console.log('→ Inicializando banco de dados pela primeira vez...')
  fs.mkdirSync(DATADIR, { recursive: true })
  execFileSync(MYSQL_BIN, [
    '--initialize-insecure',
    `--datadir=${DATADIR}`,
    `--user=${process.env.USER}`,
  ], { stdio: 'inherit' })
  console.log('   Banco inicializado.')
}

console.log('→ Iniciando MySQL (porta 3307)...')

const child = spawn(MYSQL_BIN, [
  `--datadir=${DATADIR}`,
  `--port=${PORT}`,
  '--bind-address=127.0.0.1',
  `--socket=${SOCKET}`,
  `--pid-file=${PID_FILE}`,
  `--log-error=${LOG_FILE}`,
  '--mysqlx=OFF',
  `--user=${process.env.USER}`,
], { stdio: 'ignore', detached: true })

child.unref()

const deadline = Date.now() + 15000
while (Date.now() < deadline) {
  try {
    await mysql.createConnection({ socketPath: SOCKET, user: 'root' })
    console.log('✅ MySQL pronto!')
    process.exit(0)
  } catch {
    await new Promise((r) => setTimeout(r, 500))
  }
}

console.error('❌ Falha ao iniciar o MySQL. Veja ' + LOG_FILE)
process.exit(1)
