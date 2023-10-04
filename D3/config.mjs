import fs from 'fs'
import { resolve } from 'path'

const cfgPath = resolve('config.json')
const cfgSavePath = resolve('last.config.json')

process.env.NODE_ENV ||= 'development'

const port = process.env.NODE_ENV === 'production'
    ? process.env.NODE_PORT
    : 8080

const {
    NODE_HTTP_HOST,
    NODE_DB_HOST,
    NODE_DB_PORT,
    NODE_DB_USER,
    NODE_DB_PASS,
} = process.env

const config = {
    server: {
        host: NODE_HTTP_HOST || 'localhost',
        port,
    },
    db: {
        host: NODE_DB_HOST || 'localhost',
        port: NODE_DB_PORT || 5432,
        username: NODE_DB_USER || 'local',
        password: NODE_DB_PASS || 's0s3cur3',
    }
}

// Check for existence of config file
try {
    const fileConf = JSON.parse(fs.readFileSync(cfgPath))

    config.server = {
        ...config.server,
        ...fileConf.server
    }
    config.db = {
        ...config.db,
        ...fileConf.db
    }
} catch (err) {
    console.warn(`No config file found at ${cfgPath}`)
}

// Save last running config
const output = JSON.stringify(config, null, 2)
fs.writeFileSync(cfgSavePath, output)

export default config
