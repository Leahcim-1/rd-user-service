import Koa from 'koa'
import Router from '@koa/router'
import BodyParser from 'koa-body'
import UserService from './service/user-service.js'
import ERRNO from './service/err-code.js'
import fs from 'fs'
import path from 'path'
import Logger from './util/logger.js'

const app = new Koa()
const router = new Router()
const env = process.env
const isDev = env === 'dev'
const HOST = isDev ? '127.0.0.1' : '0.0.0.0'
const PORT = isDev ? 5000 : 8230

// Middleware

/**
 * Request Logger
 */
app.use(async ({ request }, next) => {
  Logger.log('\n\n')
  Logger.log('From:', request.origin)
  Logger.log(request.method, request.URL.pathname)
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

// Create User Service
const userService = new UserService(connInfo)

function createResBody (message, data) {
  return JSON.stringify({
    message,
    data
  })
}

/*
 * Router Below
 */
router.get('home', '/', ({ res }) => {
  res.end('Hello, this is Bender, the bending machine')
})

/**
 * @METHOD GET
 * @PATH /user
 */
router.get('/user', async ({ response }) => {
  const { errno, res } = await userService.getAllUsers(10, 0)
  response.status = errno === ERRNO.OK ? 200 : 400
  response.body = createResBody(errno, res)
})

/**
 * @METHOD GET
 * @PATH /user/:id
 */
router.get('/user/:id', async ({ response, params }) => {
  const { id } = params
  const { errno, res } = await userService.getUserById(id)
  const responseCodeMap = {
    [ERRNO.OK]: res.length === 0 ? 404 : 200,
    [ERRNO.UN]: 400
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD GET
 * @PATH /user/:id/address
 */
router.get('/user/:id/address', async ({ response, params }) => {
  const { id } = params
  const { errno, res } = await userService.getUserById(id)
  const responseCodeMap = {
    [ERRNO.OK]: res.length === 0 ? 404 : 200,
    [ERRNO.UN]: 400
  }
  const data = {
    address_id: res.length === 0 ? null : res[0].address_id
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, data)
})

/**
 * @METHOD POST
 * @PATH /user
 */
router.post('/user', async ({ request, response }) => {
  const {
    id = '',
    first_name = '',
    last_name = '',
    email = '',
    address_id = ''
  } = request.body

  // Check id
  if (!id) {
    response.status = 400
    response.body = createResBody(ERRNO.NOID)
    return
  }

  const { res, errno } = await userService.postUser(id, {
    id,
    first_name,
    last_name,
    email,
    address_id
  })

  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.UN]: 500,
    [ERRNO.DUPID]: 400,
    [ERRNO.DUPEM]: 409
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD POST
 * @PATH /user/:id/address
 */
router.post('/user/:id/address', ctx => {

})

/**
 * @METHOD PUT
 * @PATH /user
 */
router.put('/user/:id', async ({ params, request, response }) => {
  const { id } = params
  const {
    first_name = '',
    last_name = '',
    email = '',
    address_id = ''
  } = request.body

  // filter empty field 
  const data = { 
    first_name,
    last_name,
    email,
    address_id,
  }
  for (let [key, val] of Object.entries(data)) {
     if (!val) delete data[key]
  }

  // User Service
  const { errno, res } = await userService.updateUser(id, data)
  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.UN]: 500,
    [ERRNO.NOEXIST]: 400,
    [ERRNO.DUPEM]: 409,
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD DELETE
 * @PATH /user/:id
 */
router.delete('/user/:id', async ({ params, response }) => {
  const { id } = params
  
  // User Service
  const { errno, res } = await userService.delete(id)
  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.UN]: 500,
    [ERRNO.NOEXIST]: 400,
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

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