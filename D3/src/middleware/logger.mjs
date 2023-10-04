export default (request, response, next) => {
    const logString = `${request.method} ${request.url} (${request.socket.remoteAddress})`

    console.log(logString)
    next()
}
