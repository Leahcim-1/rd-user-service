import mysql from 'mysql'
import Logger from '../util/logger.js'
import { promisify } from 'util'

export default class MySQL {
  static defaultConnInfo () {
    return {
      host: 'localhost',
      user: 'bender',
      password: 'secret',
      database: 'your_db'
    }
  }

  constructor (connInfo = MySQL.defaultConnInfo()) {
    if (connInfo.password === 'secret') throw Error('You must provide database connection info')
    this.connInfo = connInfo
  }

  createConn () {
    Logger.log('\n\nMySQL is going to connect...')
    Logger.log(`Host:     ${this.connInfo.host}`)
    Logger.log(`User:     ${this.connInfo.user}`)
    return mysql.createConnection(this.connInfo)
  }

  async executeQuery (statement = '', args = []) {
    try {
      const conn = this.createConn()

      const connect = promisify(conn.connect).bind(conn)
      const query = promisify(conn.query).bind(conn)

      await connect()
      Logger.log('Connected!')

      Logger.log(`Excuting statement: ${statement}`)
      const res = await query({
        sql: statement,
        values: args
      })

      conn.end()
      return res
    } catch (err) {
      Logger.log(err)
      throw err
    } finally {
      Logger.log('Done')
    }
  }

  __createWhereClause (kv = {}) {
    const where = Object.keys(kv).map(key => '`' + key + '`' + ' = ?').join(' AND ')
    const value = Object.values(kv)
    return { where, value }
  }

  async getByWhereObject (schema, table, kv = {}) {
    const { where, value } = this.__createWhereClause(kv)
    const statement = `select * from ${schema}.${table} where ${where}`
    return await this.executeQuery(statement, value)
  }

  async getByQueryPair (schema, table, column, value) {
    const statement = `select * from ${schema}.${table} where ${column} like '${value}%'`
    return await this.executeQuery(statement)
  }

  async insert (schema, table, data = {}) {
    const col = Object.keys(data).join(', ')
    const val = Object.values(data).map(v => `'${v}'`).join(', ')
    const statement = `
      INSERT INTO ${schema}.${table} (${col})
      VALUES (${val});
    `
    return await this.executeQuery(statement)
  }
}
