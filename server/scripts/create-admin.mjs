#!/usr/bin/env node
// server/scripts/create-admin.mjs
// Скрипт для создания первого админа через CLI

import { getPayload } from 'payload'
import config from '../payload.config.mjs'
import dotenv from 'dotenv'
import readline from 'readline'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  console.log('\n🔧 Creating first admin user...\n')

  const email = await question('Email: ')
  const password = await question('Password: ')
  const name = await question('Name: ')

  if (!email || !password || !name) {
    console.error('❌ All fields are required!')
    process.exit(1)
  }

  try {
    const payload = await getPayload({ config })

    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name,
        role: 'admin',
      },
    })

    console.log('\n✅ Admin user created successfully!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log('\n🔗 Login at: /admin\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()