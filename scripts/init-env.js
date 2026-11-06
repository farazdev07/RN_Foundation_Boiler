// Creates local .env.* files from the committed examples without touching ones
// that already exist, so a fresh clone can build straight away.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

for (const name of ['development', 'staging', 'production']) {
  const target = path.join(root, `.env.${name}`);
  if (!fs.existsSync(target)) {
    fs.copyFileSync(`${target}.example`, target);
    console.log(`created .env.${name}`);
  }
}
