const {Pool} = require('pg');
const {ident, literal} = require('pg-escape');
const env = require('./env');

/**
 * ```javascript
 * const {db} = require('pg-role');
 * ```
 * @private
 */
const db = module.exports = {};
db.pools = {};

/**
 * Creates pool connections if they don't exists, and waits for them to connect.
 * Returns cached connection when they do exist.
 * @async
 * @function
 * @param {array|string} pools array of pool connection names
 * @example db.connect(['admin', 'editor', 'viewer']).then(() => {
 *      console.log(db.pools);
 *      server.listen();
 * });
 */
db.connect = pools => {
    if (typeof pools === 'string') {
        pools = [pools];
    } else if (!Array.isArray(pools) || !pools.length) {
        pools = ['default'];
    }
    return Promise.all(pools.map(name => {
        if (db.pools[name]) {
            return Promise.resolve(db.pools[name]);
        } else {
            const config = validatePoolConfig(name);
            const pool = db.pools[name] = new Pool(config);
            return pool.connect();
        }
    }));
};

/**
 * Returns specified pool connection, creating one if it doesn't alread exist.
 * @async
 * @function
 * @param {string} pool pool connection name
 * @example async function execQuery (str) {
 *      const client = await db.client('admin');
 *      return await client.query(str);
 *  }
 */
db.client = async function (pool) {
    if (typeof pool !== 'string' || !pool.length) {
        pool = 'default';
    }
    if (!db.pools[pool]) {
       await db.connect([pool]);
    }
    return db.pools[pool];
};

/**
 * Release pool if available.
 * If no pool is specified it will release all pools.
 * @function
 * @param {string} pool pool connection name
 * @example db.release('admin');
 */
db.release = pool => {
    if (typeof pool === 'string' && pool.length) {
        return db.pools[pool]
            && db.pools[pool].release
            && db.pools[pool].release()
            && delete db.pools[pool];
    }
    Object.keys(db.pools).forEach(key => {
        return db.pools[key]
            && db.pools[key].release
            && db.pools[key].release()
            && delete db.pools[key];
    });
};

db.validateOptions = options => {
    if (!options || typeof options !== 'object') {
        throw new Error('invalid options object');
    }
    if (typeof options.schema !== 'string' || !options.schema.length) {
        options.schema = 'public';
    }
    if (typeof options.pool !== 'string' || !options.pool.length) {
        options.pool = 'default';
    }
    if (typeof options.model !== 'string' || !options.model.length) {
        throw new Error('you must specify a valid model');
    }
    return options;
};

db.validateSelectOptions = options => {
    return where(db.validateOptions(options));
};

db.validateInsertOptions = options => {
    options = db.validateOptions(options);
    if (!options.set || typeof options.set !== 'object') {
        throw new Error('you must specify a set object');
    }
    return options;
};

db.validateUpdateOptions = options => {
    options = where(db.validateInsertOptions(options));
    if (!options.where || typeof options.where !== 'object') {
        throw new Error('you must specify valid where object');
    }
    return options;
};

db.validateDeleteOptions = options => {
    options = where(db.validateOptions(options));
    if (!options.where || typeof options.where !== 'object') {
        throw new Error('you must specify valid where object');
    }
    return options;
};

function validatePoolConfig (name) {
    if (typeof name !== 'string' || !name.length) {
        throw new Error('invalid pool name');
    }
    name = name.toUpperCase();
    const config = name === 'DEFAULT'
        ? {
            host: env.PGHOST,
            database: env.PGDATABASE,
            port: env.PGPORT,
            user: env.PGUSER,
            password: env.PGPASSWORD
        } : {
            host: env[`PG_${name}_HOST`] || env.PGHOST,
            database: env[`PG_${name}_DATABASE`] || env.PGDATABASE,
            port: env[`PG_${name}_PORT`] || env.PGPORT,
            user: env[`PG_${name}_USER`],
            password: env[`PG_${name}_PASSWORD`]
        };
    Object.keys(config).some(key => {
        const val = config[key];
        if (typeof val !== 'string') {
            if (name === 'DEFAULT') {
                throw new Error(`environment variable PG${key.toUpperCase()} not found`);
            } else {
                throw new Error(`environment variable PG_${name}_${key.toUpperCase()} not found`);
            }
        }
    });
    return config;
}

function where (options) {
    if (!options.where || typeof options.where !== 'object') {
        options.where = {};
    }
    if (!isNaN(options.id)) {
        options.where.id = options.id;
        options.limit = 1;
    }
    return options;
}

