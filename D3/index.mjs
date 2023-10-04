import Express from "express"
import nunjucks from "nunjucks"
import bodyParser from "body-parser"
import cookieSession from "cookie-session"

import config from "./config.mjs"

import loggingMiddleware from "./src/middleware/logger.mjs"

import authenticationMiddleware, {
    accessMiddleware,
    protectedMiddleware,
} from "./src/middleware/authentication.mjs"

import defaultRoute from "./src/routes/default.mjs"
import echoParam from "./src/routes/echoParam.mjs"

const data = {
    users: [
        { login: 'admin', pass: 'admin' },
        { login: 'user', pass: 'user' }
    ],
    todos: [
        {
            author: 'user',
            content: 'exercise'
        }
    ]
}

const { host: serverHost, port: serverPort } = config.server
const serverUrl = `http://${serverHost}:${serverPort}`
console.log(`Environment : ${process.env.NODE_ENV || 'development'}\n`)
console.log(`Initializing server on ${serverUrl}`)

const app = Express()

nunjucks.configure('src/views', {
    autoescape: true,
    express: app
})

app.use(loggingMiddleware)

app.use(cookieSession({
    name: 'session',
    keys: ['super secret', 'so secure'],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(authenticationMiddleware)

app.use('/private', accessMiddleware)
app.use('/protected', protectedMiddleware)

app.use('/param/:value', echoParam)

app.get('/login', (req, res) => {
    res.render('login.html')
})
app.post('/login', (req, res) => {
    const { username, password } = req.body

    const user = data.users.find(user => user.login === username)

    if (user && password === user.pass) {
        console.log(`User ${username} logged in`)

        req.session.user = username

        return res.status(200).redirect('/todo')
    }

    res.status(401).redirect('/login')
})

app.get('/register', (req, res) => {
    res.render('register.html')
})
app.post('/register', (req, res) => {
    const { username, password } = req.body

    const user = data.users.find(user => user.login === username)

    if (user) {
        return res.status(400).redirect('/login')
    }

    data.users.push({ login: username, pass: password })

    console.log(`User ${username} registered`)

    res.status(200).redirect('/login')
})

app.get('/todo', (req, res) => {
    if (req.auth) {
        return res.render('todo.html', {
            user: req.auth.user,
            todos: data.todos
                .filter(todo => todo.author === req.auth.user)
        })
    }

    res.status(401).redirect('/login')
})

app.use(defaultRoute)


app.listen(config.server.port, config.server.host, () => {
    console.log(`Server listening on ${serverUrl}`)
})
