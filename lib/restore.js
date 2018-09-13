const db = require('./db');
const parse = require('./parse');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {restore} = require('pg-role');
 * ```
 * @function
 * @name Restore
 * @param {object} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} [options.schema='public'] database schema
 * @param {string} options.model table to select from
 * @param {object} options.where conditions
 * @param {number} options.id add id to where conditions
 * @example async function restoreEmployee (id) {
 *      return await restore({
 *          model: 'employees',
 *          id
 *      });
 *  }
 */

module.exports = async function remove (options={}) {
    options = db.validateDeleteOptions(options);
    options.set = {
        deleted_at: '',
        deleted_by: '',
        updated_at: new Date().toISOString(),
    };
    if (options.userId) {
        options.set.updated_by = String(options.userId);
    }
    const text = `
        UPDATE ${options.schema}.${options.model}
        ${parse.set(options)}
        ${parse.where(options)}
        RETURNING ${parse.columns(options)};
    `;
    const client = await db.client(options.role);
    const {rows} = await client.query({
        text,
        rowMode: options.rowMode
    });
    return rows;
};

