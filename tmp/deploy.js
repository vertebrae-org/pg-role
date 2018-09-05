const {
    pool,
    stages,
    models
} = require('../lib/dbClient');
const escape = require('pg-escape');
const fetch = require('node-fetch');
const URL = require('url');
const requiredFields = require('../lib/requiredFields');
const uniqueFields = require('../lib/uniqueFields');
const {spawn} = require('child_process');
const {exists} = require('fs');
const {
    writeFile,
    createWriteStream
} = require('fs');
const path = require('path');
const env = require('./env');
const s3 = require('s3');
const CloudFront = require('aws-sdk').CloudFront;

const s3Client = s3.createClient({
    s3Options: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,

    }
});

const cloudfront = new CloudFront();

let assetPath, basePath, log;

module.exports = async function deploy(options = {}, io) {
    validate(options);
    log = io
        ? (...msg) => {
            io.emit(options.employeeId, msg.join(' '));
        }
        : console.log;
    const client = pool(options.role);
    const selectedExperience = await getExperience(options, client);
    log('| stage:', options.stage, '\n');
    log('| experience id:', selectedExperience.id, '\n');
    log('| name:', selectedExperience.name, '\n');
    log('| description:', selectedExperience.description, '\n');
    const config = getConfig(selectedExperience);
    config.key = selectedExperience.key;
    config.stage = options.stage;
    config.ref = selectedExperience.ref;
    config.repo = selectedExperience.repo;
    config.subdomain = selectedExperience.subdomain;
    config.distributionId = env.AWS_DISTRIBUTION_ID;
    basePath = `https://${config.subdomain}.vertebrae.io/${options.stage}/${selectedExperience.key}`;
    await buildAndPublish(options, config);
    await updateExperience(options, client);
    return {
        url: `${basePath}/index.html`
    };
};

function validate(options) {
    if (!options.stage) {
        throw new Error('you must specify deployment stage');
    }
    if (!options.experienceId) {
        throw new Error('you must specify an experience to deploy');
    }
    if (!options.employeeId) {
        throw new Error('invalid employee id');
    }
}

async function getExperience(options, client) {
    const ad = await client.query(`select * from ${options.stage}.experiences where id = '${options.experienceId}'`);
    if (ad.rows.length === 0) {
        throw new Error(`ad id ${options.experienceId} not found in ${options.stage}`);
    }
    return ad.rows[0];
}

function getConfig(selectedExperience) {
    let config;
    try {
        config = JSON.parse(selectedExperience.config);
    } catch (e) {
        throw new Error('invalid configuration');
    }
    return config;
}

function writeFilePromise(file, data) {
    return new Promise(async (respond, reject) => {
        writeFile(file, JSON.stringify(data, null, 3), err => {
            if (err) {
                return reject(err);
            }
            respond();
        });
    });
}

function existsPromise(file) {
    return new Promise(async respond => {
        exists(file, bool => {
            respond(bool);
        });
    });
}

function spawnPromise(cmd, args, opts = {}, options) {
    return new Promise((respond, reject) => {
        const child = spawn(cmd, args, opts);
        child.stdout.on('data', log);
        child.stderr.on('data', log);
        let interval;
        if (options) {
            interval = setInterval(() => {
                if (options.canceled === true) {
                    child.stdin.pause();
                    child.kill();
                    reject('request aborted');
                }
            }, 250);
        }
        child.on('close', (code) => {
            clearInterval(interval);
            if (code === 0) {
                respond();
            } else {
                reject();
            }
        });
    });
}

async function buildAndPublish(options, config) {
    if (options.canceled === true) {
        throw new Error('request aborted');
    }
    const repo = config.repo.split('/').pop().split('.')[0];
    const repoPath = path.resolve('repo', repo);
    assetPath = path.resolve(repoPath, 'assets');
    if (!await existsPromise(repoPath)) {
        await spawnPromise('mkdir', ['-p', 'repo']);
        await spawnPromise('git', ['clone', config.repo], {
            cwd: 'repo'
        });
    }
    log('\n$ git fetch --all\n\n');
    await spawnPromise('git', ['fetch', '--all'], {
        cwd: path.join('repo', repo)
    });
    log('\n$ git checkout', config.ref, '\n\n');
    await spawnPromise('git', ['checkout', config.ref], {
        cwd: repoPath
    });
    log('\n$ git reset --hard\n\n');
    await spawnPromise('git', ['reset', '--hard', config.ref], {
        cwd: repoPath
    });
    log('\n$ npm install\n\n');
    await spawnPromise('npm', ['install'], {
        cwd: repoPath
    });
    if (options.canceled === true) {
        throw new Error('request aborted');
    }
    await spawnPromise('rm', ['-rf', `repo/${repo}/build`, `${repo}/assets`]);
    await spawnPromise('mkdir', ['-p', `repo/${repo}/assets`]);
    log('\nfetching assets: \n');
    const data = await fetchObject(config);
    const configFile = `${assetPath}/config.json`;
    log('\n\nwriting config file:', configFile, '\n');
    await writeFilePromise(configFile, data);
    await spawnPromise('node_modules/.bin/webpack', [configFile, '--progress', '--env=production'], {
        cwd: repoPath,
        env
    });
    if (options.canceled === true) {
        throw new Error('request aborted');
    }
    const prefix = `${config.stage}/${config.key}`
    log(`\ncopy build to: s3://vtag/${prefix}/\n`);
    await syncBuildFolder(path.join(repoPath, 'build'), 'vtag', prefix);
    log(`\ninvalidate cloudfront cache at ${config.distributionId}/${prefix}/\n`);
    await bustCloudfrontCache(prefix, config.distributionId);
    log('\nSUCCESS\n');
    log(`\npreview: https://${config.subdomain}.vertebrae.io/${prefix}/index.html`);
    log(`\ntag: <script src='https://${config.subdomain}.vertebrae.io/${prefix}/adtag.js'></script>\n\n`);
}

function syncBuildFolder(localDir, Bucket, Prefix) {
    return new Promise((response, reject) => {
        var params = {
            localDir,
            deleteRemoved: true,
            s3Params: {
                Bucket,
                Prefix
            },
        };
        var uploader = s3Client.uploadDir(params);
        uploader.on('error', reject);
        uploader.on('end', response);
    });
}

function bustCloudfrontCache(Prefix, DistributionId) {
    return new Promise((respond, reject) => {
        var params = {
            DistributionId,
            InvalidationBatch: {
                CallerReference: Date.now().toString(),
                Paths: {
                    Quantity: 1,
                    Items: [
                        `/${Prefix}/*`,
                    ]
                }
            }
        };
        cloudfront.createInvalidation(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                respond(data);
            }
        });
    });
}

async function fetchAsset(str) {
    if (typeof str === 'string') {
        let uri, isCss;
        if (str.indexOf('http') === 0) {
            uri = str;
        } else if (str.indexOf('url') === 0) {
            isCss = true;
            uri = str.slice(4, -1);
        } else {
            return str;
        }
        const res = await fetch(uri);
        if (!res.ok) {
            console.error('could not fetch asset:', str);
            process.exit(1);
        }
        const url = URL.parse(uri);
        const fileArray = url.pathname.split('/');
        const fileName = decodeURIComponent(fileArray.pop());
        if (fileName) {
            const file = `assets/${fileName}`;
            const filePath = `${assetPath}/${fileName}`;
            const dest = createWriteStream(filePath);
            log(`\r\n${uri}`);
            res.body.pipe(dest);
            return isCss ?
                `url(${basePath}/${file})` :
                `${basePath}/${file}`;
        }
    }
}

async function fetchArray(arr) {
    if (Array.isArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
            let item = arr[i];
            if (typeof item === 'string') {
                arr[i] = await fetchAsset(item);
            } else if (Array.isArray(item)) {
                arr[i] = await fetchArray(item);
            } else if (typeof item === 'object') {
                arr[i] = await fetchObject(item);
            }
        };
        return arr;
    }
}

async function fetchObject(obj) {
    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            const key = keys[i];
            let item = obj[keys[i]];
            if (key === 'href' || key === 'fallbackUrl') {
                // do nothing
            } else if (typeof item === 'string') {
                obj[key] = await fetchAsset(item);
            } else if (Array.isArray(item)) {
                obj[key] = await fetchArray(item);
            } else if (typeof item === 'object') {
                obj[key] = await fetchObject(item);
            }
        };
        return obj;
    }
}

async function updateExperience(options, client) {
    const setObject = {
        deployed_at: new Date().toUTCString(),
        deployed_by: options.employeeId
    };
    const set = Object.keys(setObject).reduce((set, key) => {
        if (setObject[key]) {
            set.push(`${escape.ident(key)} = ${escape.literal(setObject[key].toString())}`);
        }
        return set;
    }, []);
    const queryString = `UPDATE ${options.stage}.experiences SET ${set.join(', ')} WHERE id = ${options.experienceId};`;
    const result = await client.query(queryString);
    return result.rowCount;
}
