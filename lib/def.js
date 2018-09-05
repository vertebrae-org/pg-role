const db = require('./db');
const query = require('./query');

/**
 * ```javascript
 * const {def} = require('pg-role');
 * ```
 * @function
 * @param {object} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} [options.schema='public'] database schema
 * @param {string} options.database database name
 * @param {string} options.model table to select from
 * @example async function getTableDef (database, model) {
 *      return await def({
 *          database,
 *          model
 *      });
 *  }
 */

module.exports = async function def (options) {
    options = db.validateOptions(options);
    const queryString = `
        SELECT
            column_name,
            data_type,
            ordinal_position
        FROM information_schema.columns
        WHERE table_catalog = '${options.database}'
            AND table_schema = '${options.schema}'
            AND table_name = '${options.model}'
        ORDER BY ordinal_position;
    `;
    const result = await query({
        text: queryString,
        pool: options.pool,
        rowMode: options.rowMode
    });
    return {
        fields: result.fields.map(field => {return field.name;}),
        rows: result.rows
    };
};

