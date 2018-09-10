const where = require('./where')
const db = require('./db');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {update} = require('pg-role');
 * ```
 * @function
 * @name Update
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
    options.set.updated_at = new Date().toISOString();
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
        BEGIN;
        UPDATE ${options.schema}.${options.model} SET ${set.join(', ')} ${where(options)};
        SELECT * from ${options.schema}.${options.model} ORDER BY updated_at DESC LIMIT 1;
        COMMIT;
    `;
    const client = await db.client(options.role);
    const results = await client.query({
        text: queryString,
        rowMode: options.rowMode
    });
    return results[2].rows[0];
};

