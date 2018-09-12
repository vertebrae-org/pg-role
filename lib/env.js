const dotenv = require('dotenv');

module.exports = dotenv.config({path: '../.env'})
    && dotenv.config()
    && process.env
    || process.env;

