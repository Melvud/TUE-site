const { exec } = require('child_process');
const path = require('path');

// Запускаем payload migrate:create для генерации начальных миграций
console.log('🔄 Creating initial migrations...');

exec('npx payload migrate:create', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Migration creation failed:', error);
    return;
  }
  console.log(stdout);
  if (stderr) console.error(stderr);
  console.log('✅ Migrations created successfully');
});