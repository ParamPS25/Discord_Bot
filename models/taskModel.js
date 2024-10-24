const mongoose = require("mongoose");

const taskSchema = mongoose.Schema({
    taskId: {
         type: String, 
         unique: true 
    },
    userId: { 
        type: String, 
        required: true 
    },
    description: {
        type : String,
    },
    createdAt: {
        type: Date, 
        default: Date.now 
    },
    completed: {
        type: Boolean,
        default: false 
    },

    user: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    }
});

const Task = mongoose.model('Task',taskSchema)

module.exports = Task;