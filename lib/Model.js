const {models} = require('..');
const db = require('./db');
const def = require('./def');
const select = require('./select');
const insert = require('./insert');
const update = require('./update');
const remove = require('./remove');
const restore = require('./restore');
const env = require('./env');
const {ident, literal} = require('pg-escape');

/**
 * ```javascript
 * const {Model} = require('pg-role');
 * ```
 * @class
 * @param {string} model
 * @param {object} props
 * @param {string} [props.pool='default'] pool connection name
 * @param {string} [props.schema='public'] database schema
 */

class Model {
    /**
     * @param {string} model - Model name
     * @param {object} props - configuration object
     * @example async getEmployeeModel() {
     *      return new Model('employees');
     * };
     */
    constructor (model, props) {
        const scope = this;
        if (typeof model !== 'string' || model.length < 1) {
            if (typeof model === 'object' && typeof model.model === 'string' && model.model.length > 1) {
                props = model;
                model = props.model;
            } else {
                throw new Error('invalid model' + model);
            }
        }
        scope.state = Object.assign({
            database: env.PGDATABASE,
            columns: '*'
        }, props, {
            model
        });
    }

    getModelDef () {
        const state = this.state;
        return def({
            model: state.model,
            schema: state.schema,
            database: state.database
        });
    }

    /**
     * @param {object} set - set values object
     * @returns {ModelInstance}
     * @example async function createEmployee (email) {
     *      const employee = await Employee.create({
     *          email
     *      });
     *      console.log(employee.get()));
     *  }
     */
    async create (set) {
        const scope = this;
        const state = scope.state;
        const data = await insert({
            model: state.model,
            schema: state.schema,
            set
        });
        return  new ModelInstance(state, data);
    }

    /**
     * @param {object} opts - options object
     * @returns {object} selectObject
     * @example function findEmployeesEmailLike(wild) {
     *      return Employee.select({
     *          where: {
     *              $like: {
     *                  email:  `%${wild}%`
     *              }
     *          }
     *      });
     *  }
     */
    async select (opts) {
        const scope = this;
        if (!opts || typeof opts !== 'object') {
            opts = {};
        }
        const state = scope.state;
        return select({
            columns: opts.columns || state.columns || '*',
            schema: opts.schema || state.schema || 'public',
            model: state.model,
            where: opts.where,
            limit: opts.limit,
            group: opts.group,
            order: opts.order
        });
    }

    /**
     * @param {object|number} where - id or where object
     * @param {object} options - options object
     * @returns {ModelInstance}
     * @example async function createEmployee (email) {
     *      const Employee = new Model('employees');
     *      const employee = await Employee.find({
     *          email: testUserB
     *      });
     *      console.log(employee.get()));
     *  }
     */
    async find (where, options) {
        const scope = this;
        const state = scope.state;
        if (typeof where === 'number') {
            where = {id: where};
        } else if (!isNaN(where)) {
            where = {id: parseInt(where, 10)};
        } else if (!where || typeof where !== 'object') {
            throw new Error('invalid where object');
        }
        if (!options || typeof options !== 'object') {
            options = {};
        }
        const {rows} = await select({
            columns: options.columns || state.columns,
            model: state.model,
            schema: options.schema || state.schema,
            rowMode: options.rowMode,
            deleted: options.deleted,
            userId: state.userId,
            where,
            limit: 1,
        });
        const data = rows && rows[0];
        return new ModelInstance(Object.assign({}, state, options), data);
    }

}

/**
 * ```javascript
 * const {Model} = require('pg-role');
 * ```
 * @class
 * @desc model instance created by Model.create('model_name')
 * @example async function messWithEmployee (email) {
 *      const Employee = new Model('employee');
 *      const employee = await Employee.create({
 *          email: 'some.employee@company.com',
 *          position: 'employee'
 *      });
 *      console.log(employee.get('email')); // {email: 'employee@company.com', ...}
 *      await employee.update({
 *          position: 'manager'
 *      });
 *      console.log(employee.get()); // {id: 45, email: 'manager@company.com, ...}
 *      await employee.delete();
 *      console.log(employee.get()); // {id: 45, email: 'manager@company.com, deleted_at: '2018-09-11T04:44:36.725Z', ...}
 *      await employee.restore();
 *      console.log(employee.get()); // {id: 45, email: 'manager@company.com, ...}
 *  }
 */
class ModelInstance {
    /**
     * @param {string} model
     * @param {object} props
     * @param {string} [props.pool='default'] pool connection name
     * @param {string} [props.schema='public'] database schema
     * @example
     *  const employee = new Model.employee();
     */
    constructor(props, data) {
        const scope = this;
        scope.state = Object.assign({}, props, {
            data
        });
    }

    /**
     * @param {string} prop - property to retrieve, if not specified all props are returned.
     * @example async function testGet() {
     *      const Employee = new Model('employee');
     *      const employee = await Employee.create({
     *          email: 'employee@company.com'
     *      });
     *      console.log(employee.get()); // employee@company.com
     *      employee.update({
     *          email: 'manager@company.com'
     *      });
     *      console.log(employee.get()); // manager@company.com
     *  }
     */
    get(props) {
        const scope = this;
        if (Array.isArray(props)) {
            return props.map(prop => {
                return scope.state.data[prop];
            });
        }
        return typeof props === 'string'
            ? scope.state.data[props]
            : scope.state.data;
    }

    /**
     * @param {set} props - set values object
     * @example async function updateEmployee(id, set) {
     *      const Employee = new Model('employee');
     *      const employee = await Employee.find(id);
     *      employee.update(set);
     *  }
     */
    async update(set) {
        const scope = this;
        const state = scope.state;
        const res = await update({
            model: state.model,
            schema: state.schema,
            id: state.data.id,
            set
        });
        state.data = res[0];
        return scope;
    }

    /**
     * @example async function deleteEmployee(id) {
     *      const Employee = new Model('employee');
     *      const employee = await Employee.find(id);
     *      employee.delete();
     *  }
     */
    async delete() {
        const scope = this;
        const state = scope.state;
        const res = await remove({
            model: state.model,
            schema: state.schema,
            id: state.data.id,
        });
        state.data = res[0];
        return scope;
    }

    /**
     * @example async function deleteEmployee(id) {
     *      const Employee = new Model('employee');
     *      const employee = await Employee.find(id);
     *      employee.restore();
     *  }
     */
    async restore() {
        const scope = this;
        const state = scope.state;
        const res = await restore({
            model: state.model,
            schema: state.schema,
            id: state.data.id
        });
        state.data = res[0];
        return scope;
    }

}

module.exports = Model;
module.exports.models = {};

