const db = require('./db');
const parse = require('./parse');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {remove} = require('pg-role');
 * ```
 * @function
 * @name Remove
 * @param {object} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} [options.schema='public'] database schema
 * @param {string} options.model table to select from
 * @param {object} options.where conditions
 * @param {number} options.id add id to where conditions
 * @example async function removeEmployee (id) {
 *      return await remove({
 *          model: 'employees',
 *          id
 *      });
 *  }
 */

module.exports = async function remove (options={}) {
    options = db.validateDeleteOptions(options);
    options.set = {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    if (options.userId) {
        options.set.deleted_by = options.userId;
        options.set.updated_by = options.userId;
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

