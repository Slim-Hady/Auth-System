const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');

const {PORT} = require('./config/key');
const MONGO_CONNECTION = require('./config/DB');
const { verifyEmailConnection } = require('./config/email');

verifyEmailConnection();
MONGO_CONNECTION();

app.listen(PORT, () => {
    console.log(`app running on port 3001`);
})
