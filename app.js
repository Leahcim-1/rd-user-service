import Koa from 'koa'
import BodyParser from 'koa-body'
import fs from 'fs'
import path from 'path'
import { dev, prod } from './config.js'
import router from './router/index.js'
import Logger from './util/logger.js'

const app = new Koa()
const env = process.env.NODE_ENV
const isDev = env === 'dev'
const HOST = isDev ? dev.host: prod.host
const PORT = isDev ? dev.port : prod.port

// Middleware

/**
 * Request Logger
 */
app.use(async ({ request }, next) => {
  Logger.log('\n\n')
  Logger.log(request.method, request.URL.pathname)
  Logger.log('Headers:', request.header)
  await next()
})

/**
 * Body Parser
 */
app.use(BodyParser())

// Check Conn Config
const configPath = path.resolve('conn-config.json')
if (!fs.existsSync(configPath)) throw Error('Database Connection Info Config File Not Found')
const connInfo = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }))



/*
 * Server Listening
 */
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(PORT, HOST, () => {
  console.log('\n')
  console.log('-'.repeat(50))
  console.log('\nUser Service')
  console.log('\nThis is Bender, the bending machine.\n')
  console.log(`Your damn server is starting at http://${HOST}:${PORT}\n`)
  console.log('-'.repeat(50))
})
