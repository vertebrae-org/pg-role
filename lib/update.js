const db = require('./db');
const parse = require('./parse');
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
        options.set.updated_by = options.userId;
    }
    const text = `
        BEGIN;
            UPDATE ${options.schema}.${options.model}
                ${parse.set(options)}
                FROM (
                    SELECT *
                    FROM ${options.schema}.${options.model}
                    ${parse.where(options)}
                    ${parse.limit(options)}
                ) sub
                WHERE ${options.schema}.${options.model}.id = sub.id;
            SELECT *
                FROM ${options.schema}.${options.model}
                ORDER BY updated_at DESC
                ${parse.limit(options)};
        END;
    `;
    const client = await db.client(options.role);
    const results = await client.query({
        text,
        rowMode: options.rowMode
    });
    return results[2].rows;
};

