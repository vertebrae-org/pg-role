const db = require('./db');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {insert} = require('pg-role');
 * ```
 * @async
 * @function
 * @param {object} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} [options.schema='public'] database schema
 * @param {string} options.model table to select from
 * @param {object} options.set values to set
 * @example async function newEmployee (set) {
 *      return await insert({
 *          model: 'employees',
 *          set
 *      });
 *  }
 */
module.exports = async function insert (options) {
    options = db.validateInsertOptions(options);
    options.set.created_at = new Date().toUTCString();
    if (options.userId) {
        options.set.created_by = String(options.userId);
    }
    const keys = Object.keys(options.set);
    const columns = `(${keys.map(key => {return ident(key);}).join(', ')})`;
    const values = `(${keys.map(key => {return literal(options.set[key]);}).join(', ')})`;
    const queryString = `
        INSERT INTO ${options.schema}.${options.model} ${columns} VALUES ${values};
    `;
    const client = await db.client(options.role);
    const result = await client.query({
        text: queryString,
        rowMode: options.rowMode
    });
    return {count: result.rowCount};
};

