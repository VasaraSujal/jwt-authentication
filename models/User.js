const mongoose = require('mognoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        requires : [true , "name is required"],
        unique : true
    },
    email : {
        type : String,
        requires : [true , "email is required"],
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
        requires : [true , "password is required"],
    },
    isVerified:{
        type : Boolean,
        default : false
    },
    otp:{
        type:String,
        maxlength:[6 , "maximum length should be 6"]
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

module.exports = mongoose.model("User", userSchema);