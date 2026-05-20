import fs from 'node:fs';

const original = fs.readFileSync;
fs.readFileSync = (...args) =>
  original(...args).replace('Hello, world!', 'Hello, Filip!');

process.stdout.write(fs.readFileSync('hello.txt', 'utf8'));
