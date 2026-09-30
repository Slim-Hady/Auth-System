const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const app = require('./app');

const { PORT, EMAIL_ENABLED } = require('./config/key');
const MONGO_CONNECTION = require('./config/DB');
const { verifyConnection } = require('./config/email');

if (EMAIL_ENABLED) {
    verifyConnection();
}
else {
    console.log("Email is disabled (EMAIL_ENABLED=false) - skipping SMTP check, users auto-verified");
}
MONGO_CONNECTION();

app.listen(PORT, () => {
    console.log(`app running on port 3001`);
})
