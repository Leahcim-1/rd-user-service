import MySQL from '../db/MySQL-Service.js'
import ERRNO from './err-code.js'

export default class UserService {
  constructor (connInfo) {
    this.sql = new MySQL(connInfo)
    this.schema = 'user'
    this.table = 'user_table'
  }

  createRes (errno, res = []) {
    return {
      errno,
      res
    }
  }

  async executeWithTry (fn = () => {}, isReturning = true) {
    try {
      const res = await fn()
      return this.createRes(ERRNO.OK, isReturning ? res : {})
    } catch (e) {
      return this.createRes(ERRNO.DBERR, e)
    }
  }

  async getAllUsers (limit = 10, offset = 0) {
    const fn = async () => await this.sql.executeQuery(`SELECT * FROM ${this.schema}.${this.table} LIMIT ${limit} OFFSET ${offset}`)
    return await this.executeWithTry(fn, true)
  }

  async getUserById (id) {
    const fn = async () => await this.sql.getByQueryPair(this.schema, this.table, 'id', id)
    return await this.executeWithTry(fn, true)
  }

  async postUser (id, data) {
    // * Check existed ID
    const existedID = await this.sql.getByQueryPair(this.schema, this.table, 'id', id)
    if (existedID && existedID.length > 0) return this.createRes(ERRNO.DUPID)

    // * Check existed Email
    const { email = '' } = data
    if (email) {
      const existedEmail = await this.sql.getByQueryPair(this.schema, this.table, 'email', email)
      if (existedEmail && existedEmail.length > 0) return this.createRes(ERRNO.DUPEM)
    }

    const fn = async () => await this.sql.insert(this.schema, this.table, data)
    return await this.executeWithTry(fn, false)
  }

  async updateUser (id, data = {}) {
    // * Check existed record
    const existed = await this.sql.getByQueryPair(this.schema, this.table, 'id', id)
    if (!existed || existed.length === 0) return this.createRes(ERRNO.NOEXIST)

    // * Check existed Email
    const { email = '' } = data
    if (email) {
      const existedEmail = await this.sql.getByQueryPair(this.schema, this.table, 'email', email)
      if (existedEmail && existedEmail.length > 0) return this.createRes(ERRNO.DUPEM)
    }

    const modification = Object.entries(data).map(([k, v]) => `${k} = '${v}'`).join(', ')
    const statement = `
      UPDATE ${this.schema}.${this.table} 
      SET ${modification}
      where id = ${id}
    `
    const fn = async () => await this.sql.executeQuery(statement)
    return await this.executeWithTry(fn, false)
  }

  async delete (id) {
    // * Check existed record
    const existed = await this.sql.getByQueryPair(this.schema, this.table, 'id', id)
    if (!existed || existed.length === 0) return this.createRes(ERRNO.NOEXIST)

    const fn = async () => await this.sql.executeQuery(`DELETE FROM ${this.schema}.${this.table} WHERE id = ${id}`)
    return await this.executeWithTry(fn, false)
  }
}
