const express = require('express');
const AppError = require('./utils/AppError');
const cookieParser = require('cookie-parser');
const globalErrorHandling = require('./controllers/error.controller');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const healthCheck = require('./routes/health.routes');

const morgan = require('morgan');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/v1/', healthCheck)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);

app.all('*path', (req, res, next) => {
    next(new AppError(`can't find ${req.originalUrl} on this server` , 404));
})

app.use(globalErrorHandling);

module.exports = app;