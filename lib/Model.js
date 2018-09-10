const {models} = require('..');
const db = require('./db');
const def = require('./def');
const select = require('./select');
const insert = require('./insert');
const update = require('./update');
const remove = require('./remove');
const restore = require('./restore');
const where = require('./where')
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
     *      return await new Model('employees');
     * };
     */
    constructor (model, props) {
        const scope = this;
        if (typeof model !== 'string'
            || model.length < 1
        ) {
            throw new Error('invalid props' + props);
        }
        scope.state = Object.assign({
            model,
            database: env.PGDATABASE,
            schema: 'public',
            columns: '*'
        }, props, {
            enabled: false
        });
    }

    checkConnection () {
        const scope = this;
        if (!scope.state.enabled) {
            return scope.connect();
        }
    }

    async connect () {
        const scope = this;
        const def = await scope.getModelDef()
        const rows = def.rows;
        const valid = [
            'id',
            'email',
            'created_at',
            'created_by',
            'updated_at',
            'updated_at',
            'deleted_at',
            'deleted_by'
        ].every(column => {
            return def.rows.some(row => {
                return row.column_name === column;
            });
        });
        if (!valid) {
            throw new Error('invalid model');
        }
        scope.state.def = def;
        scope.state.enabled = true;
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
        await scope.checkConnection();
        const state = scope.state;
        const data = await insert({
            model: state.model,
            schema: state.schema,
            set
        });
        return new ModelInstance(scope, state, data);
    }

    /**
     * @param {object} opts - options object
     * @returns {object} selectObject
     * @example async function findEmployees() {
     *      const employee = await Employee.select({
     *          where: {
     *              $like: {
     *                  email: '%@comapany.com'
     *              }
     *          }
     *      });
     *  }
     */
    async select (opts) {
        const scope = this;
        await scope.checkConnection();
        if (!opts || typeof opts !== 'object') {
            opts = {};
        }
        const state = scope.state;
        return select({
            columns: opts.columns || state.columns,
            schema: opts.schema || state.schema,
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
        await scope.checkConnection();
        const {rows} = await select({
            columns: options.columns || state.columns,
            model: state.model,
            schema: options.schema || state.schema,
            where,
            limit: 1,
            rowMode: options.rowMode
        });
        const data = rows && rows[0];
        return new ModelInstance(scope, options, data);
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
 *      const instance = await Employee.create({
 *          email: 'some.employee@company.com',
 *          position: 'employee'
 *      });
 *      console.log(instance.get()); // {id: 45, email: 'employee@company.com', ...}
 *      await instance.update({
 *          position: 'manager'
 *      });
 *      console.log(instance.get()); // {id: 45, email: 'manager@company.com, ...}
 *      await instance.delete();
 *      console.log(instance.get()); // {id: 45, email: 'manager@company.com, deleted_at: '2018-09-11T04:44:36.725Z', ...}
 *      await instance.restore();
 *      console.log(instance.get()); // {id: 45, email: 'manager@company.com, ...}
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
    constructor(model, props, data) {
        const scope = this;
        scope.state = Object.assign({},
            props,
            {data}
        );
        scope.model = model;
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
    get(prop) {
        const scope = this;
        return typeof prop === 'string'
            ? scope.state.data[prop]
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
        await scope.model.checkConnection();
        const state = scope.state;
        scope.state.data = await update({
            model: state.model,
            schema: state.schema,
            id: state.data.id,
            set
        });
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
        await scope.model.checkConnection();
        const state = scope.state;
        scope.state.data = await remove({
            model: state.model,
            schema: state.schema,
            id: state.data.id,
        });
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
        await scope.model.checkConnection();
        const state = scope.state;
        scope.state.data = await restore({
            model: state.model,
            schema: state.schema,
            id: state.data.id
        });
        return scope;
    }


}

module.exports = Model;

