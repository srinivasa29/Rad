const CustomFilter = require('../models/CustomFilter');

/**
 * POST /api/screener/filters
 * Create a new custom filter for the authenticated user.
 */
const createCustomFilter = async (req, res) => {
    try {
        const { name, options, logicQuery } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'Filter name is required.' });
        }

        const parsedOptions = Array.isArray(options)
            ? options.map(String).map(s => s.trim()).filter(Boolean)
            : String(options || '')
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean);

        const filter = await CustomFilter.create({
            userId: req.user._id,
            name: String(name).trim(),
            options: parsedOptions,
            logicQuery: String(logicQuery || '').trim(),
        });

        return res.status(201).json({ success: true, data: filter });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'A filter with this name already exists.' });
        }
        return res.status(500).json({ success: false, message: error.message || 'Failed to create filter.' });
    }
};

/**
 * GET /api/screener/filters
 * Return all custom filters belonging to the authenticated user.
 */
const getCustomFilters = async (req, res) => {
    try {
        const filters = await CustomFilter.find({ userId: req.user._id }).sort({ createdAt: -1 });
        return res.json({ success: true, data: filters });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to fetch filters.' });
    }
};

/**
 * DELETE /api/screener/filters/:id
 * Delete a custom filter by ID (only if owned by the authenticated user).
 */
const deleteCustomFilter = async (req, res) => {
    try {
        const filter = await CustomFilter.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

        if (!filter) {
            return res.status(404).json({ success: false, message: 'Filter not found.' });
        }

        return res.json({ success: true, message: 'Filter deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Failed to delete filter.' });
    }
};

module.exports = { createCustomFilter, getCustomFilters, deleteCustomFilter };
