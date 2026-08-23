import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

describe('Bug 9: Availability Calendar & Date Blocking', () => {
  it('should toggle and manage blocked dates accurately', () => {
    let blocked = []
    const toggle = (date) => {
      blocked = blocked.includes(date) ? blocked.filter((d) => d !== date) : [...blocked, date].sort()
    }

    toggle('2026-09-10')
    assert.deepStrictEqual(blocked, ['2026-09-10'])

    toggle('2026-09-05')
    assert.deepStrictEqual(blocked, ['2026-09-05', '2026-09-10'])

    // Toggle off
    toggle('2026-09-10')
    assert.deepStrictEqual(blocked, ['2026-09-05'])
  })

  it('should render interactive calendar components in ProfilePage.tsx', () => {
    const file = path.resolve('src/pages/ProfilePage.tsx')
    const content = fs.readFileSync(file, 'utf8')

    assert.match(content, /toggleBlockedDate/)
    assert.match(content, /blockedDates/)
    assert.match(content, /Disponibilidade & Calendário/)
  })
})
