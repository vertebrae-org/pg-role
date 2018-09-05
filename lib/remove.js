const db = require('./db');
const where = require('./where')
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {remove} = require('pg-role');
 * ```
 * @function
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
    const setOptions = {
        deleted_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
    };
    if (options.userId) {
        setOptions.deleted_by = String(options.userId);
        setOptions.updated_by = String(options.userId);
    }
    const set = Object.keys(setOptions).reduce((set, key) => {
        if (setOptions[key]) {
            set.push(`${ident(key)} = ${literal(setOptions[key].toString())}`);
        } else {
            set.push(`${escape.ident(key)} = NULL`);
        }
        return set;
    }, []);
    const queryString = `
        update ${options.schema}.${options.model} SET ${set.join(', ')} ${where(options)};
    `;
    const client = await db.client(options.role);
    const result = await client.query({
        text: queryString,
        rowMode: options.rowMode || 'array'
    });
    return {deleted: result.rowCount};
};

