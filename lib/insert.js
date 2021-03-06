const db = require('./db');
const parse = require('./parse');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {insert} = require('pg-role');
 * ```
 * @async
 * @function
 * @name Insert
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
    options.set.created_at = new Date().toISOString();
    if (options.userId) {
        options.set.created_by = options.userId;
    }
    const keys = Object.keys(options.set);
    const columns = `(${keys.map(key => {return ident(key);}).join(', ')})`;
    const values = `VALUES (${keys.map(key => {return parse.getValue(options.set[key])}).join(', ')})`;
    const text = `
        INSERT INTO ${options.schema}.${options.model}
        ${columns}
        ${values}
        RETURNING ${parse.columns(options)};
    `;
    const client = await db.client(options.role);
    const {rows} = await client.query({
        text,
        rowMode: options.rowMode
    });
    return rows[0];
};

