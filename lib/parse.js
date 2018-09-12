const {ident, literal} = require('pg-escape');

const parse = module.exports = {};

parse.columns = options => {
    if (!options || !options.columns) {
        return '*';
    } else if (typeof options.columns === 'string') {
        return options.columns;
    } else if (Array.isArray(options.columns)) {
        return options.columns.join(', ');
    } else  {
        return '*';
    }
};

parse.where = options => {
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
                    return `${ident(gt)} > ${getValue(value[gt])}`;
                }).join(' AND ');
            } else if (key === '$gte') {
                return Object.keys(value).map(gte => {
                    return `${ident(gte)} >= ${getValue(value[gte])}`;
                }).join(' AND ');
            } else if (key === '$lte') {
                return Object.keys(value).map(lte => {
                    return `${ident(lte)} <= ${getValue(value[lte])}`;
                }).join(' AND ');
            } else if (key === '$lt') {
                return Object.keys(value).map(lt => {
                    return `${ident(lt)} < ${getValue(value[lt])}`;
                }).join(' AND ');
            } else if (key === '$ne') {
                return Object.keys(value).map(ne => {
                    return `${ident(ne)} != ${getValue(value[ne])}`;
                }).join(' AND ');
            } else if (key === 'id') {
                options.limit = 1;
                return `id = ${value}`;
            } else if (toLowerCase === 'is null') {
                return `${ident(key)} IS NULL`;
            } else if (toLowerCase === 'is not null') {
                return `${ident(key)} IS NOT NULL`;
            } else {
                return `${ident(key)} = ${getValue(value)}`;
            }
        }).join(' AND ')}`;
    } else if (!isNaN(options.id)) {
        options.limit = 1;
       return `WHERE id = ${options.id}`;
    } else {
        return '';
    }
};

function getValue(obj) {
    if (typeof obj === 'string') {
        return literal(obj);
    } else if (typeof obj === 'number') {
        return obj;
    } else if (typeof obj === 'date') {
        return literal(obj.toISOString());
    }
}

parse.offset = options => {
    return !isNaN(options.offset)
        ? `OFFSET ${Number(options.offset)}`
        : '';
};

parse.limit = (options, defaultLimit) => {
    defaultLimit = typeof defaultLimit === 'number'
        && defaultLimit > 0
            ? defaultLimit
            : '1000';
    return !isNaN(options.limit) && options.limit > 0
        ? `LIMIT ${Number(options.limit)}`
        : `LIMIT ${defaultLimit}`;
};

parse.group = options => {
    if (typeof options.group === 'string' && options.group.length) {
        return `GROUP BY ${literal(options.group)}`;
    } else if (Array.isArray(options.group)) {
        return `GROUP BY ${options.group.map(literal).join(', ')}`;
    } else {
        return '';
    }
};

parse.order = options => {
    return !!options.order
        ? `ORDER BY ${literal(options.order)} ASC`
        : 'ORDER BY id ASC';
};

parse.set = options => {
    if (!options || !options.set) {
        return '';
    }
    const obj = options.set;
    return 'SET ' + Object.keys(obj).reduce((set, key) => {
        const value = obj[key];
        if (typeof value === 'number') {
            set.push(`${ident(key)} = ${value}`);
        } else if (typeof value === 'string' && value.length > 0) {
            set.push(`${ident(key)} = ${literal(obj[key])}`);
        } else if (value instanceof Date) {
            set.push(`${ident(key)} = ${literal(obj[key].toString())}`);
        } else {
            set.push(`${ident(key)} = NULL`);
        }
        return set;
    }, []).join(', ');
}

