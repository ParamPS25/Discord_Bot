const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId : {
        type:String,
        unique: true
    },
    username :{
        type : String,
    },
    registeredAt : {
        type : Date,
        default : Date.now()
    },
    tasks : [{
        type : mongoose.Schema.Types.ObjectId , ref : 'Task'
    }]
})

const User = mongoose.model('User',userSchema);

module.exports = User