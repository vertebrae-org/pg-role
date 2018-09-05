const {ident, literal} = require('pg-escape');

module.exports = options => {
    const where = options.where;
    const keys = Object.keys(where);
    if (where && typeof where === 'object' && keys.length) {
        return `WHERE ${keys.map(key => {
            const value = where[key];
            const toLowerCase = typeof value === 'string'
                && value.toLowerCase();
            if (toLowerCase === 'is null') {
                return `${ident(key)} IS NULL`;
            } else if (toLowerCase === 'is not null') {
                return `${ident(key)} IS NOT NULL`;
            } else if (typeof value === 'number') {
                return `${ident(key)} = ${value}`;
            } else {
                return `${ident(key)} = ${literal(value)}`;
            }
        }).join(' AND ')}`;
    } else if (!isNaN(options.id)) {
        options.limit = 1;
       return `WHERE id = ${options.id}`;
    } else {
        return '';
    }
}

