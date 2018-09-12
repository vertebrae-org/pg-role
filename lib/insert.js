const db = require('./db');
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
    const values = `VALUES (${keys.map(key => {return literal(options.set[key]);}).join(', ')})`;
    const text = `
        BEGIN;
            INSERT INTO ${options.schema}.${options.model}
                ${columns}
                ${values};
            SELECT *
                FROM ${options.schema}.${options.model}
                ORDER BY created_at DESC
                LIMIT 1;
        END;
    `;
    const client = await db.client(options.role);
    const results = await client.query({
        text,
        rowMode: options.rowMode
    });
    return results[2].rows[0];
};

