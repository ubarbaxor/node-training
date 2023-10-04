export default (request, response, next) => {
    if (request.session?.user) {
        request.auth = {
            authenticated: true,
            user: request.session.user,
        }
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