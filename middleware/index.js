import qs from 'qs'

const qsMiddleware = async (ctx, next) => {
  const { querystring } = ctx.request
  ctx.qs = qs.parse(querystring)
  await next()
}

export {
  qsMiddleware
}

export * from './interceptor.js'
