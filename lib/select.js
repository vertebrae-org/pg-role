const db = require('./db');
const parse = require('./parse');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {select} = require('pg-role');
 * ```
 * @function
 * @name Select
 * @param {object} options
 * @param {string} [options.pool='default'] pool connection name
 * @param {string} [options.schema='public'] database schema
 * @param {string} options.model table to select from
 * @param {object} options.where conditions
 * @param {number} options.id add id to where conditions
 * @param {array|string} [options.group=''] group by column(s)
 * @param {number} [options.offset=0] offset result index
 * @param {number} [options.limit=1000] limit result length
 * @param {boolean} [options.deleted=false] do not filter rows with 'deleted_at' timestamp
 * @example async function getEmployee (id) {
 *      return await select({
 *          model: 'employees',
 *          id
 *      });
 *  }
 * @example async function getDeletedEmployee (id) {
 *      return await select({
 *          model: 'employees',
 *          id,
 *          where: {
 *              deleted_at: 'not null'
 *          }
 *      });
 *  }
 * @example async function getActiveEmployeesByRole (role) {
 *      return await select({
 *          model: 'employees',
 *          where: {
 *              role
 *          }
 *      });
 *  }
 * @example async function getAllEmployeesByRole (role) {
 *      return await select({
 *          model: 'employees',
 *          deleted: true,
 *          where: {
 *              role
 *          }
 *      });
 *  }
 */
module.exports = async function select (options) {
    options = db.validateSelectOptions(options);
    if (!options.where.deleted_at && !options.deleted) {
        options.where.deleted_at = 'is null';
    }
    const text = `
        SELECT ${parse.columns(options.columns)}
        FROM ${options.schema}.${options.model}
        ${parse.where(options)}
        ${parse.offset(options)}
        ${parse.group(options)}
        ${parse.order(options)}
        ${parse.limit(options)}
    `;
    const client = await db.client(options.role);
    const result = await client.query({
        text,
        rowMode: options.rowMode
    });
    return {
        fields: result.fields.map(field => {return field.name;}),
        rows: result.rows
    };
};


