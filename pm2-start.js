const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Al-Ahlam System Server...');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npm, ['run', 'start'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

child.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
});
