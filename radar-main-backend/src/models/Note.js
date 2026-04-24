const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

NoteSchema.index({ userId: 1, symbol: 1 });

module.exports = mongoose.model('Note', NoteSchema);
