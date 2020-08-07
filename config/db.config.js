require('dotenv').config({ path: 'process.env' });

module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASS,
  DB: process.env.DATABASE,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 200000,
    idle: 1000000,
  },
};
