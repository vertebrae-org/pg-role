const db = require('./db');
const where = require('./where')
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {select} = require('pg-role');
 * ```
 * @function
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
    const query = `
        SELECT ${options.columns || '*'}
        FROM ${options.schema}.${options.model}
        ${where(options)}
        ${offset(options)}
        ${group(options)}
        ${order(options)}
        ${limit(options)}
    `;
    const client = await db.client(options.role);
    const result = await client.query({
        text: query,
        rowMode: options.rowMode
    });
    return {
        fields: result.fields.map(field => {return field.name;}),
        rows: result.rows
    };
};

function columns(options) {
    if (typeof options.columns === 'string') {
        return options.columns;
    } else if (Array.isArray(options.columns)) {
        return options.columns.join(', ');
    } else  {
        return '*';
    }
}

function limit(options) {
    return !isNaN(options.limit) && options.limit > 0
        ? `LIMIT ${Number(options.limit)}`
        : 'LIMIT 1000';
}

function offset(options) {
    return !isNaN(options.offset)
        ? `OFFSET ${Number(options.offset)}`
        : '';
}

function group(options) {
    if (typeof options.group === 'string' && options.group.length) {
        return `GROUP BY ${literal(options.group)}`;
    } else if (Array.isArray(options.group)) {
        return `GROUP BY ${options.group.map(literal).join(', ')}`;
    } else {
        return '';
    }
}

function order(options) {
    return !!options.order
        ? `ORDER BY ${literal(options.order)} ASC`
        : 'ORDER BY id ASC';
}

