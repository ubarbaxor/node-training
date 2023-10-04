import Express from "express"
import nunjucks from "nunjucks"
import bodyParser from "body-parser"
import cookieSession from "cookie-session"

import config from "./config.mjs"

// DB Setup
import Mongoose from "mongoose"
const { host: dbHost, port: dbPort, name: dbName } = config.db
const dbUrl = `mongodb://${dbHost}:${dbPort}/${dbName}`
Mongoose.connect(dbUrl)
    .then(() => console.log(`Connected to MongoDB at ${dbHost}:${dbPort}`))
    .catch(err => console.error(err))

import todos from "./src/models/todos.mjs"
import users from "./src/models/users.mjs"

import loggingMiddleware from "./src/middleware/logger.mjs"

import authenticationMiddleware, {
    accessMiddleware,
    protectedMiddleware,
} from "./src/middleware/authentication.mjs"

import defaultRoute from "./src/routes/default.mjs"
import echoParam from "./src/routes/echoParam.mjs"

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

    users.findOne({ login: username })
        .then(user => {
            if (user && password === user.pass) {
                console.log(`User ${username} logged in`)

                req.session.user = username

                return res.status(200).redirect('/todo')
            }

            res.status(401).redirect('/login')
        })
})

app.get('/register', (req, res) => {
    res.render('register.html')
})
app.post('/register', (req, res) => {
    const { username, password } = req.body

    const found = users.findOne({ login: username })

    found.then(user => {
        if (!user) {
            return users.create({ login: username, pass: password })
        } else {
            console.error(`User ${username} already exists`)
            res.status(401).redirect('/register')
        }
    }).then(created => {
        console.log(`User ${username} registered`)
        console.log(created)
        res.status(200).redirect('/login')
    }).catch(err => {
        console.error(err)
        res.status(500).redirect('/register')
    })
})

const authRouter = Express.Router()
authRouter.use((req, res, next) => {
    console.log('Auth router')
    if (req.auth) {
        return next()
    }

    res.status(401).redirect('/login')
})

authRouter.get('/todo', (req, res) => {
    if (req.auth) {
        todos.find({ author: req.auth.user })
            .then(todos => {
                res.render('todo.html', {
                    user: req.auth.user,
                    todos
                })
            })
    }
})
authRouter.post('/todo', (req, res) => {
    const { author, content } = req.body
    const { user } = req.auth

    if (user) {
        console.log(`User ${user} adds todo: ${content}`)
        todos.create({ author, content })
            .then(() => res.status(200).redirect('/todo'))
    }
})

authRouter.use('/logout', (req, res) => {
    console.log(`User ${req.auth.user} logged out`)
    req.session = null

    res.status(200).redirect('/login')
})
app.use(authRouter)

app.use(defaultRoute)


app.listen(config.server.port, config.server.host, () => {
    console.log(`Server listening on ${serverUrl}`)
})
