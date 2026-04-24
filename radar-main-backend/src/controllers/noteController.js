const Note = require('../models/Note');

const getNotes = async (req, res) => {
    const { symbol } = req.params;
    try {
        const notes = await Note.find({ userId: req.user._id, symbol: symbol.toUpperCase() }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notes" });
    }
};

const addNote = async (req, res) => {
    const { symbol, content } = req.body;
    if (!symbol || !content) return res.status(400).json({ error: "Symbol and content are required" });

    try {
        const note = new Note({
            userId: req.user._id,
            symbol: symbol.toUpperCase(),
            content
        });
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: "Failed to add note" });
    }
};

const deleteNote = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Note.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!result) return res.status(404).json({ error: "Note not found" });
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete note" });
    }
};

module.exports = { getNotes, addNote, deleteNote };
