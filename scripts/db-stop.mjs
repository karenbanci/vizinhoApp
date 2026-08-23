import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PID_FILE = path.join(ROOT, 'mysql-data', 'mysqld.pid')

if (!fs.existsSync(PID_FILE)) {
  console.log('MySQL não está rodando.')
  process.exit(0)
}

const pid = Number(fs.readFileSync(PID_FILE, 'utf8'))

try {
  process.kill(pid, 'SIGTERM')
  console.log('→ Encerrando MySQL...')

  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    if (!fs.existsSync(PID_FILE)) {
      console.log('✅ MySQL encerrado.')
      process.exit(0)
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  console.error('❌ MySQL não encerrou a tempo.')
  process.exit(1)
} catch {
  console.log('Processo não encontrado. Removendo arquivo de PID...')
  fs.rmSync(PID_FILE, { force: true })
}
