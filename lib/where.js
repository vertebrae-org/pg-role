const {ident, literal} = require('pg-escape');

module.exports = options => {
    const where = options.where;
    const keys = Object.keys(where);
    if (where && typeof where === 'object' && keys.length) {
        return `WHERE ${keys.map(key => {
            const value = where[key];
            const toLowerCase = typeof value === 'string'
                && value.toLowerCase();
            if (key === '$like') {
                return Object.keys(value).map(like => {
                    return `${ident(like)} like ${literal(value[like])}`;
                }).join(' AND ');
            } else if (key === '$gt') {
                return Object.keys(value).map(gt => {
                    return `${ident(gt)} > ${value[gt]}`;
                }).join(' AND ');
            } else if (key === '$gte') {
                return Object.keys(value).map(gte => {
                    return `${ident(gte)} >= ${value[gte]}`;
                }).join(' AND ');
            } else if (key === '$lte') {
                return Object.keys(value).map(lte => {
                    return `${ident(lte)} <= ${value[lte]}`;
                }).join(' AND ');
            } else if (key === '$lt') {
                return Object.keys(value).map(lt => {
                    return `${ident(lt)} < ${value[lt]}`;
                }).join(' AND ');
            } else if (key === '$ne') {
                return Object.keys(value).map(ne => {
                    return `${ident(ne)} != ${value[ne]}`;
                }).join(' AND ');
            } else if (toLowerCase === 'is null') {
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

