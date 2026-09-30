const {Schema , model} = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    firstName: {
        type: String,
        required: [true, "First name must be filled"],
        trim: true
    },

    secondName: {
        type: String,
        required: [true, "Second name must be filled"],
        trim: true
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    email: {
        type: String,
        required: [true, "Email must be filled"],
        trim: true,
        unique: true,
        validate: validator.isEmail
    },
    password: {
        type: String,
        required: [true, "Password must be filled"],
        trim: true,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationOTP: {
    type: String,
    select: false
    },

    verificationOTPExpires: {
    type: Date,
    select: false
    }, 

    resetOTP: {
    type: String,
    select: false
    },

    resetOTPExpires: {
    type: Date,
    select: false
    }, 
    refreshToken: [{
        type: String,
        trim: false,
        select: false
    }]
    
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('userName').get(function(){
    return `${this.firstName} ${this.secondName}`;
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.pre('save' , async function() {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 12);
});

const User = model("User", userSchema);
module.exports = User;