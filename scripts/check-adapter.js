
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
console.log('Class name:', PrismaLibSQL ? 'PrismaLibSQL' : 'Not Found');

const { PrismaLibSql } = require('@prisma/adapter-libsql');
console.log('Alternative name:', PrismaLibSql ? 'PrismaLibSql' : 'Not Found');

console.log('All exports:', Object.keys(require('@prisma/adapter-libsql')));
