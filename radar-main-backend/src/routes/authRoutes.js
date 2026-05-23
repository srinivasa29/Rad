const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth, forgotPassword, resetPassword, devInspectUser, devListUsers } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Dev-only inspector: GET /api/auth/dev/user-inspect?login=USERNAME_OR_EMAIL[&testPassword=plainpwd]
router.get('/dev/user-inspect', devInspectUser);
router.get('/dev/list-users', devListUsers);

module.exports = router;
