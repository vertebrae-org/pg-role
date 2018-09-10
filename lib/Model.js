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

module.exports = class Model {

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

    connect () {
        const scope = this;
        return scope.getModelDef().then(def => {
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

    async findOne (opts) {
        const scope = this;
        await scope.checkConnection();
        if (typeof opts === 'number') {
            opts = {id: opts};
        } else if (!opts || typeof opts !== 'object') {
            throw new Error('invalid options object');
        }
        const state = db.validateSelectOptions(this.state);
        return select({
            columns: opts.columns || state.columns,
            schema: opts.schema || state.schema,
            model: state.model,
            where: opts.where,
            id: opts.id,
            limit: 1
        });
    }

    async find (opts) {
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

    async create (set) {
        const scope = this;
        await scope.checkConnection();
        const state = scope.state;
        return insert({
            model: state.model,
            schema: state.schema,
            set
        });
    }

    async update(opts) {
        const scope = this;
        await scope.checkConnection();
        const state = scope.state;
        return update({
            model: state.model,
            schema: state.schema,
            where: opts.where,
            id: opts.id,
            set: opts.set
        });
    }

    async delete(opts) {
        const scope = this;
        await scope.checkConnection();
        if (typeof opts === 'number') {
            opts = {id: opts};
        } else if (!opts || typeof opts !== 'object') {
            throw new Error('invalid options object');
        }
        const state = scope.state;
        return remove({
            model: state.model,
            schema: state.schema,
            where: opts.where,
            id: opts.id
        });
    }

    async restore(opts) {
        const scope = this;
        await scope.checkConnection();
        if (typeof opts === 'number') {
            opts = {id: opts};
        } else if (!opts || typeof opts !== 'object') {
            throw new Error('invalid options object');
        }
        const state = scope.state;
        return restore({
            model: state.model,
            schema: state.schema,
            where: opts.where,
            id: opts.id
        });
    }

}

