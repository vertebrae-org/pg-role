const where = require('./where')
const db = require('./db');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {update} = require('pg-role');
 * ```
 * @function
 * @param {object} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} [options.schema='public'] database schema
 * @param {string} options.model table to select from
 * @param {object} options.where conditions
 * @param {number} options.id add id to where conditions
 * @param {object} options.set values to set
 * @example async function updateEmployee (id, set) {
 *      return await update({
 *          model: 'employees',
 *          id,
 *          set
 *      });
 *  }
 */
module.exports = async function update (options) {
    options = db.validateUpdateOptions(options);
    options.set.updated_at = new Date().toUTCString();
    if (options.userId) {
        options.set.updated_by = String(options.userId);
    }
    const set = Object.keys(options.set).reduce((set, key) => {
        if (options.set[key]) {
            set.push(`${ident(key)} = ${literal(options.set[key].toString())}`);
        }
        return set;
    }, []);
    const queryString = `
        UPDATE ${options.schema}.${options.model} SET ${set.join(', ')} ${where(options)};
    `;
    const client = await db.client(options.role);
    const result = await client.query({
        text: queryString,
        rowMode: options.rowMode
    });
    return {count: result.rowCount};
};

