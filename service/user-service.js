import MySQL from '../db/MySQL-Service.js'
import Logger from '../util/logger.js'
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
      Logger.log(e)
      return this.createRes(ERRNO.DBERR, e)
    }
  }


  async checkExistedId(id) {
    // * Check existed ID
    const condition = this.sql.createColumnValueCondition('id', id)
    const record = await this.getUserByCondition(condition)
    return record 
        && record.errno === ERRNO.OK
        && record.res.length !== 0 
  }

  async checkNonExistedId(id) {
    // * Check non-existed ID
    const condition = this.sql.createColumnValueCondition('id', id)
    const record = await this.getUserByCondition(condition)
    return record 
        && record.errno === ERRNO.OK
        && record.res.length === 0 
  }

  async checkDupEmail(email) {
    const condition = this.sql.createColumnValueCondition('email', email)
    const existedEmail = await this.getUserByCondition(condition)
    console.log(existedEmail)
    return existedEmail
        && existedEmail.errno === ERRNO.OK
        && existedEmail.res.length > 0
  }

  async getAllUsers (limit = 10, offset = 0) {
    const fn = this.sql.selectStatement(this.schema, this.table, [], limit, offset)
    return await this.executeWithTry(fn, true)
  }

  async getUserByCondition (condition) {
    const fn = async () => await this.sql.selectStatement(this.schema, this.table)(condition)
    return await this.executeWithTry(fn, true)
  }

  async getUserById (id) {
    const condition = this.sql.createColumnValueCondition('id', id)
    return await this.getUserByCondition(condition)
  }

  async postUser (id, data) {
    // * Check User Existed
    const existed = await this.checkExistedId(id)
    if (existed) return this.createRes(ERRNO.DUPID)

    // * Check existed Email
    const { email = '' } = data
    if (email) {
      const existedEmail = await this.checkDupEmail(email)
      if (existedEmail) return this.createRes(ERRNO.DUPEM)
    }

    const fn = async () => await this.sql.insertStatement(this.schema, this.table, data)
    return await this.executeWithTry(fn, false)
  }

  async updateUser (id, data = {}) {
    // * Check User Existed
    const nonExisted = await this.checkNonExistedId(id)
    if (nonExisted) return this.createRes(ERRNO.NOEXIST)

    // * Check existed Email
    const { email = '' } = data
    if (email) {
      const existedEmail = await this.checkDupEmail(email)
      if (existedEmail) return this.createRes(ERRNO.DUPEM)
    }

    // execute PUT
    const condition = this.sql.createColumnValueCondition('id', id)
    const fn = async () => await this.sql.updateStatement(
      this.schema, 
      this.table, 
      condition, 
      data
    )
    return await this.executeWithTry(fn, false)
  }

  async delete (id) {
    // * Check User Non-existed
    const nonExisted = await this.checkNonExistedId(id)
    if (nonExisted) return this.createRes(ERRNO.NOEXIST)

    const condition = this.sql.createColumnValueCondition('id', id)
    const fn = async () => await this.sql.deleteStatement(
      this.schema,
      this.table,
      condition
    )
    return await this.executeWithTry(fn, false)
  }
}
