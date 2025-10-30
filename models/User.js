const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    log: {
        type: [
            {
                description: String,
                duration: Number,
                date: Date
            }
        ],
        default: []
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;