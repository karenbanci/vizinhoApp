import mysql from 'mysql2/promise'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SOCKET = path.join(ROOT, 'mysql-data', 'mysql.sock')
const DB_NAME = process.env.DB_NAME || 'vizinho'
const DB_USER = process.env.DB_USER || 'vizinho_app'
const DB_PASS = process.env.DB_PASS || 'vizinho123'

const conn = await mysql.createConnection({ socketPath: SOCKET, user: 'root' })

console.log(`→ Criando banco de dados "${DB_NAME}"...`)
await conn.query(
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
)

console.log(`→ Criando usuário "${DB_USER}" com senha...`)
await conn.query(
  `CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}'`
)
await conn.query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'`)
await conn.query('FLUSH PRIVILEGES')

await conn.query(`USE \`${DB_NAME}\``)
await conn.query(`
  CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_provider   TINYINT(1) NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

const [userCols] = await conn.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_provider'`,
  [DB_NAME]
)
if (userCols.length === 0) {
  await conn.query(`ALTER TABLE users ADD COLUMN is_provider TINYINT(1) NOT NULL DEFAULT 0`)
}

await conn.query(`
  CREATE TABLE IF NOT EXISTS provider_profiles (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL UNIQUE,
    category      VARCHAR(40) NOT NULL,
    category_label VARCHAR(80) NOT NULL,
    nationality   VARCHAR(2) NOT NULL DEFAULT 'BR',
    country       VARCHAR(2) NOT NULL DEFAULT 'BR',
    state         VARCHAR(80) NOT NULL DEFAULT '',
    city          VARCHAR(120) NOT NULL DEFAULT '',
    description   VARCHAR(300) NOT NULL DEFAULT '',
    bio           TEXT,
    price         VARCHAR(80) NOT NULL DEFAULT '',
    location      VARCHAR(120) NOT NULL DEFAULT '',
    availability  VARCHAR(80) NOT NULL DEFAULT '',
    available_now TINYINT(1) NOT NULL DEFAULT 1,
    photo_id      VARCHAR(200) NOT NULL DEFAULT '',
    services      JSON NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

const [natCols] = await conn.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'provider_profiles' AND COLUMN_NAME = 'nationality'`,
  [DB_NAME]
)
if (natCols.length === 0) {
  await conn.query(`ALTER TABLE provider_profiles ADD COLUMN nationality VARCHAR(2) NOT NULL DEFAULT 'BR'`)
}

const locCols = [
  { name: 'country', ddl: `ALTER TABLE provider_profiles ADD COLUMN country VARCHAR(2) NOT NULL DEFAULT 'BR'` },
  { name: 'state', ddl: `ALTER TABLE provider_profiles ADD COLUMN state VARCHAR(80) NOT NULL DEFAULT ''` },
  { name: 'city', ddl: `ALTER TABLE provider_profiles ADD COLUMN city VARCHAR(120) NOT NULL DEFAULT ''` },
  { name: 'portfolio_ids', ddl: `ALTER TABLE provider_profiles ADD COLUMN portfolio_ids JSON NULL` },
]
for (const { name, ddl } of locCols) {
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'provider_profiles' AND COLUMN_NAME = ?`,
    [DB_NAME, name]
  )
  if (cols.length === 0) {
    await conn.query(ddl)
  }
}

await conn.query(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at    TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

await conn.query(`
  CREATE TABLE IF NOT EXISTS service_requests (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_user_id   INT UNSIGNED NOT NULL,
    client_user_id     INT UNSIGNED NOT NULL,
    client_name        VARCHAR(120) NOT NULL,
    client_email       VARCHAR(190) NOT NULL,
    service_name       VARCHAR(120) NOT NULL,
    details            TEXT NOT NULL,
    date_time          VARCHAR(120) NOT NULL DEFAULT '',
    location           VARCHAR(255) NOT NULL DEFAULT '',
    base_price         VARCHAR(80) NOT NULL DEFAULT '',
    shipping_price     VARCHAR(80) NOT NULL DEFAULT '',
    total_price        VARCHAR(80) NOT NULL DEFAULT '',
    status             ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_req_provider FOREIGN KEY (provider_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_req_client FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

await conn.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id  INT UNSIGNED NOT NULL,
    sender_id   INT UNSIGNED NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    message     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_request FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

console.log('→ Tabelas "users", "provider_profiles", "password_reset_tokens", "service_requests" e "messages" prontas.')
console.log('\n✅ Banco de dados configurado com sucesso!')
console.log(`   Banco:  ${DB_NAME}`)
console.log(`   Usuário: ${DB_USER}`)
console.log(`   Senha:   ${DB_PASS}`)
console.log(`   Porta:   3307`)
console.log(`   Socket:  ${SOCKET}`)

await conn.end()
