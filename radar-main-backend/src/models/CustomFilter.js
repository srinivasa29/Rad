const mongoose = require('mongoose');

const CustomFilterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
    },
    options: {
        type: [String],
        default: [],
    },
    logicQuery: {
        type: String,
        default: '',
        maxlength: 1000,
    },
}, {
    timestamps: true,
});

CustomFilterSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomFilter', CustomFilterSchema);
