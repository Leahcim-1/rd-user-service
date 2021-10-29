import Koa from 'koa'
import BodyParser from 'koa-body'
import qs from 'qs'
import { dev, prod } from './config.js'
import router from './router/index.js'
import Logger from './util/logger.js'

const app = new Koa()
const env = process.env.NODE_ENV
const isDev = env === 'dev'
const HOST = isDev ? dev.host : prod.host
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
 * QueryString
 */
app.use(async (ctx, next) => {
  const { querystring } = ctx.request
  ctx.qs = qs.parse(querystring)
  await next()
})

/**
 * Set response interceptor
 */
app.use(async (ctx, next) => {
  await next()
  if (ctx.URL.pathname.includes('api')) {
    ctx.set({
      'Content-Type': 'application/json'
    })
  }
})

/**
 * Body Parser
 */
app.use(BodyParser())

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
