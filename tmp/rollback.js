const {pool, models} = require('../lib/dbClient');
const escape = require('pg-escape');
const select = require('./select');
const update = require('./update');

module.exports = async function rollback (options={}) {
    if (!options.id) {
        throw new Error('you must specify migration id');
    }
    if (!options.employeeId) {
        throw new Error('invalid employee id');
    }
    if (!options.role) {
        throw new Error('invalid role');
    }
    const where = `id = ${options.id}`;
    const selectMigration = await select({
        model: 'migrations',
        role: options.role,
        schema: 'public',
        where
    });
    const migration = selectMigration.rows[0];
    const downIndex = selectMigration.fields.indexOf('down');
    if (!migration) {
        throw new Error('invalid migration');
    }
    const client = pool(options.role === 'admin' ? 'owner' : options.role);
    const res = await client.query({
        text: migration[downIndex],
        rowMode: options.rowMode || 'array'
    }).catch(e => {
        throw new Error(e.message);
    });
    const setOptions = {
        applied_at: '',
        applied_by: '',
        updated_at: new Date().toUTCString(),
        updated_by: String(options.employeeId)
    };
    const set = Object.keys(setOptions).reduce((set, key) => {
        if (setOptions[key]) {
            set.push(`${escape.ident(key)} = ${escape.literal(setOptions[key].toString())}`);
        } else {
            set.push(`${escape.ident(key)} = NULL`);
        }
        return set;
    }, []);
    const queryString = `
        update migrations SET ${set.join(', ')} WHERE ${where};
    `;
    const result = await client.query({
        text: queryString,
        rowMode: options.rowMode || 'array'
    });
    return {
        rollback: result.rowCount,
        error: res.error,
        fields: res.fields && res.fields.map(field => {return field.name;}),
        rows: res.rows
    };
};

