const db = require('./db');
const query = require('./query');

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

