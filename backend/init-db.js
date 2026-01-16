const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

const db = new sqlite3.Database('./game.db', (err) => {
  if (err) {
    console.error('Error opening database:', err)
    return
  }
  console.log('Connected to database')
})

// Read and execute SQL schema
const schema = fs.readFileSync(path.join(__dirname, 'db/create_tables.sql'), 'utf8')
const statements = schema.split(';').filter(s => s.trim())

let completed = 0
statements.forEach((statement, index) => {
  if (statement.trim()) {
    db.run(statement + ';', (err) => {
      if (err) {
        console.error(`Error executing statement ${index}:`, err)
      } else {
        console.log(`✓ Statement ${index + 1}/${statements.length} executed`)
      }
      completed++
      if (completed === statements.length) {
        console.log('\n✅ Database initialization complete!')
        db.close()
      }
    })
  }
})
