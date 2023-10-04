export default (request, response, next) => {
    if (request.query.accessToken && request.query.accessToken !== '121234') {
        return response.status(401).end('Invalid token')
    }

    if (request.query.accessToken === '121234') {
        request.auth = { authenticated: true }
        return next()
    }

    return next()
}

export const accessMiddleware = (request, response, next) => {
    if (request.auth?.authenticated)
        return next()

    response.status(401).end('Unauthorized')
}

export const protectedMiddleware = (request, response, next) => {
    if (request.method === 'GET')
        return next()

    if (request.auth?.authenticated)
        return next()

    response.status(401).end('Unauthorized')
}