const install = module.exports = {
    db: require('./lib/db'),
    select: require('./lib/select'),
    insert: require('./lib/insert'),
    update: require('./lib/update'),
    remove: require('./lib/remove'),
    restore: require('./lib/restore'),
    query: require('./lib/query'),
    where: require('./lib/where'),
    def: require('./lib/def'),
    env: require('./lib/env')
}
