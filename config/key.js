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
    email_from_address: process.env.email_from_address,
    email_from_name: process.env.email_from_name,
    VERIFY_TYPE: process.env.VERIFY_TYPE || "otp",
    EMAIL_ENABLED: process.env.EMAIL_ENABLED === "true",
    RESEND_API: process.env.RESEND_API,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN, 
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET
}