"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allAsync = exports.getAsync = exports.runAsync = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = require("path");
const dbPath = (0, path_1.resolve)(__dirname, '../../../data/kickmates.db');
const db = new sqlite3_1.default.Database(dbPath);
// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');
// Promisify db.run
const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};
exports.runAsync = runAsync;
// Promisify db.get
const getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};
exports.getAsync = getAsync;
// Promisify db.all
const allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};
exports.allAsync = allAsync;
exports.default = db;
