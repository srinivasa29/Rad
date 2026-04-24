const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    preferredMode: {
        type: String,
        enum: ['TRADER', 'INVESTOR'],
        default: 'INVESTOR'
    },
    watchlist: [{
        symbol: String,
        name: String,
        assetType: {
            type: String,
            enum: ['STOCK', 'CRYPTO', 'FOREX']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    settings: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'dark'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            priceAlerts: { type: Boolean, default: true }
        }
    },
    pinnedCharts: [{
        symbol: String,
        label: String,
        type: {
            type: String,
            enum: ['INDEX', 'STOCK', 'CRYPTO'],
            default: 'INDEX'
        }
    }]
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
