module.exports = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    NODE_ENV: process.env.NODE_ENV,
    smtp_host: process.env.smtp_host,
    smtp_name: process.env.smtp_name,
    smtp_password: process.env.smtp_password,
    smtp_port: parseInt(process.env.smtp_port || "587", 10),
    email: process.env.email
}