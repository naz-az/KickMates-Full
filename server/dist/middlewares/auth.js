"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const auth_1 = require("../utils/auth");
const db_1 = require("../db");
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Auth Header Missing or Invalid Format');
            res.status(401).json({ message: 'Authorization token required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        console.log('Token:', token ? 'Present' : 'Missing');
        const decoded = (0, auth_1.verifyToken)(token);
        if (!decoded) {
            console.log('Token Verification Failed');
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        console.log('Decoded Token:', decoded);
        // Check if user exists
        const user = yield (0, db_1.getAsync)('SELECT id, username, email FROM users WHERE id = ?', [decoded.userId]);
        console.log('User Found:', user ? 'Yes' : 'No');
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        // Add user to request
        req.user = user;
        console.log('User attached to request:', req.user.id);
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
});
exports.authenticate = authenticate;
