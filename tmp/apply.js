const escape = require('pg-escape');
const {db, select} = require('../');

module.exports = async function apply (options={}) {
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
    const upIndex = selectMigration.fields.indexOf('up');
    if (!migration) {
        throw new Error('invalid migration');
    }
    const client = db.client(options.role === 'admin' ? 'owner' : options.role);
    const res = await client.query({
        text: migration[upIndex],
        rowMode: options.rowMode || 'array'
    }).catch(e => {
        throw new Error(e);
    });
    const setOptions = {
        applied_at: new Date().toUTCString(),
        applied_by: String(options.employeeId),
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
        applied: result.rowCount,
        error: res.error,
        fields: res.fields && res.fields.map(field => {return field.name;}),
        rows: res.rows
    };
};

