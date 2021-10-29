import Router from '@koa/router'
import fs from 'fs'
import path from 'path'
import UserService from '../service/user-service.js'
import ERRNO from '../service/err-code.js'

const router = new Router()

// Check Conn Config
const configPath = path.resolve('conn-config.json')
if (!fs.existsSync(configPath)) throw Error('Database Connection Info Config File Not Found')
const connInfo = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }))

// Create User Service
const userService = new UserService(connInfo)

/**
 * The factory function for creating response body
 * @param {Errno} message
 * @param {Object} data
 * @param {Array} links
 * @returns
 */
function createResBody (message, data, links) {
  return JSON.stringify({
    message,
    data,
    links
  })
}

/*
 * Router Below
 */

router.get('/', ({ res }) => {
  res.end('Hello, this is Bender, the bending machine')
})

router.get('/api', ({ res }) => {
  res.end('Hello, this is Bender, the bending machine')
})

/**
 * @METHOD GET
 * @PATH /user
 */
router.get('/api/users', async ({ qs, response }) => {
  const { fields = '', limit = '10', offset = '0' } = qs

  const field = fields ? fields.split(',') : []

  const { errno, res } = await userService.getAllUsers(
    field,
    parseInt(limit, 10),
    parseInt(offset, 10)
  )
  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.DBERR]: 500,
    [ERRNO.UN]: 500
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD GET
 * @PATH /user/:id
 */
router.get('/api/users/:id', async ({ qs, response, params }) => {
  const { id } = params
  const { fields = '' } = qs
  const field = fields ? fields.split(',') : []

  const { errno, res } = await userService.getUserById(id, field)
  const responseCodeMap = {
    [ERRNO.OK]: res.length === 0 ? 404 : 200,
    [ERRNO.DBERR]: 500,
    [ERRNO.UN]: 500
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD GET
 * @PATH /user/:id/address
 */
router.get('/api/user/:id/address', async ({ response, params }) => {
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
router.post('/api/users', async ({ request, response }) => {
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
    [ERRNO.OK]: 201,
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
router.post('/api/user/:id/address', ctx => {

})

/**
 * @METHOD PUT
 * @PATH /user
 */
router.put('/api/users/:id', async ({ params, request, response }) => {
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
    address_id
  }
  for (const [key, val] of Object.entries(data)) {
    if (!val) delete data[key]
  }

  // User Service
  const { errno, res } = await userService.updateUser(id, data)
  const responseCodeMap = {
    [ERRNO.OK]: 202,
    [ERRNO.UN]: 500,
    [ERRNO.NOEXIST]: 400,
    [ERRNO.DUPEM]: 409
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

/**
 * @METHOD DELETE
 * @PATH /user/:id
 */
router.delete('/api/users/:id', async ({ params, response }) => {
  const { id } = params

  // User Service
  const { errno, res } = await userService.delete(id)
  const responseCodeMap = {
    [ERRNO.OK]: 200,
    [ERRNO.UN]: 500,
    [ERRNO.NOEXIST]: 400
  }
  response.status = responseCodeMap[errno]
  response.body = createResBody(errno, res)
})

export default router
