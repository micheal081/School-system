// mongodb
require('./config/db');

// student routes
const userRouter = require('./api/student')

// express
const express = require('express')
const app = express();

// dotenv
require('dotenv').config();

// Flash
const flash = require('connect-flash')

// session
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session)

// port
const port = 5000;

// static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/assets', express.static(__dirname + 'public/assets'))

// admin
app.use(express.static('public/admin'))
app.use('/assets', express.static(__dirname + 'public/admin'))

// Set Templating Engine
app.set('view engine', 'ejs')

const store = new mongoDbStore({
    uri: process.env.ONLINE_MONGODB_URI,
    collection: `storedSession`
})

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'encryptkey',
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 20,
    }
}))

app.use(flash());

// For accepting post form data
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/', userRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})