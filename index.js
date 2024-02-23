const mongoose = require('mongoose')
require('./config/db')

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const router = require('./routes')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const bodyParser = require('body-parser')
const expressValidator = require('express-validator')
const flash = require('connect-flash')
const createError = require('http-errors')
const passport = require('./config/passport')


require('dotenv').config({path: 'variables.env'})

const app = express()

// Habilitar bodu-parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

// Validación de campos 
app.use(expressValidator())

// Habilitar handlebars como view
app.engine('handlebars', 
    exphbs.engine({
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
)

app.set('view engine', 'handlebars')

// Static files
app.use(express.static(path.join(__dirname, 'public')))

app.use(cookieParser())

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

// Inicializar passport
app.use(passport.initialize())
app.use(passport.session())

// Alertas y flash messages
app.use(flash())

// Crear middleware
app.use((req, res, next) => {
    res.locals.mensajes = req.flash()
    next()
})

app.use('/', router())

// 404 pagina no existente
app.use((req, res, next) => {
    next(createError(404, 'No encontrado :('))
})

// Administracion de los errores
app.use((error, req, res, next) => {
    res.locals.mensaje = error.message

    const status = error.status || 500;
    res.locals.status = status
    res.status(status)

    res.render('error')
})

app.listen(process.env.PUERTO)