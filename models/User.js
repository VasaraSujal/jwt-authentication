    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');

    const userSchema = new mongoose.Schema({
        username : {
            type: String,
            required : [true , "name is required"],
            unique : true
        },
        email : {
            type : String,
            required : [true , "email is required"],
            unique : true,
            lowercase : true,
            validate : {
                validator: function(value){
                    return /@/.test(value);
                },
                message:(props) => `the email must contain an '@' symbol.`
            },
        },
        password:{
            type : String,
            required : [true , "password is required"],
        },
        isVerified:{
            type : Boolean,
            default : false
        },
        otp: {
            type: String,
            validate: {
                validator: function(value) {
                    // Allow null/empty OTP or exactly 6 digits
                    return !value || /^\d{6}$/.test(value);
                },
                message: "OTP must be exactly 6 digits"
            }
        },
        otpExpiry: {
            type: Date
        },
        otpValid: {
            type: Boolean,
            default: false
        },
        tokenVersion:{
            type:Number,
            default:0
        },
        profilePicture:{
            type:String,
            default:""
        },
        darkMode:{
            type:Boolean,
            default:false
        }
    } , { timestamps: true })

    // Pre-save middleware for password hashing
    userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
    });

    // Instance method for password comparison
    userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    
    try {
        // Ensure both passwords are strings
        const storedPassword = String(this.password);
        const inputPassword = String(candidatePassword);
        
        // Direct comparison using bcrypt
        return await bcrypt.compare(inputPassword, storedPassword);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
    };

    module.exports = mongoose.model("User", userSchema);