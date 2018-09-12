const db = require('./db');

/**
 * ```javascript
 * const {query} = require('pg-role');
 * ```
 * @async
 * @function
 * @name Query
 * @param {object|string} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} options.text sql string
 * @example async function getEmployeesByDomain (domain) {
 *      return await query(`
 *          select * from employees
 *          where email like '%@${domain}'
 *          limit 1000;
 *      `);
 *  }
 * @example async function getEmployeesByDomain (domain) {
 *      return await query({
 *          pool: 'admin',
 *          text: `
 *              select * from employees
 *              where email like '%@${domain}'
 *              limit 1000;
 *          `
 *      });
 *  }
 */
module.exports = async function query (options) {
    if (typeof options === 'string') {
        options = {text: options};
    }
    const client = await db.client(options.pool);
    return await client.query({
        text: options.text,
        rowMode: options.rowMode
    });
};

