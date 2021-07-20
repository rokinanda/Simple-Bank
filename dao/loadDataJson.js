const fs = require('fs')
const loadJson = (path) => {
  const file = fs.readFileSync(path, 'utf-8')
  const contacts = JSON.parse(file)
  return contacts
}
module.exports = loadJson