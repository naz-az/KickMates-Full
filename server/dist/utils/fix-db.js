"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const db_1 = __importStar(require("../db"));
function fixDatabaseSchema() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Fixing database schema...');
            // Rename participants table to event_participants
            yield (0, db_1.runAsync)('ALTER TABLE participants RENAME TO event_participants');
            console.log('✅ Renamed participants table to event_participants');
            // Add indexes to improve query performance
            yield (0, db_1.runAsync)('CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id)');
            yield (0, db_1.runAsync)('CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id)');
            yield (0, db_1.runAsync)('CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id)');
            yield (0, db_1.runAsync)('CREATE INDEX IF NOT EXISTS idx_discussions_creator_id ON discussions(creator_id)');
            console.log('✅ Created indexes for performance');
            // Clean up unused course tables
            yield (0, db_1.runAsync)('DROP TABLE IF EXISTS dashboard_courses');
            yield (0, db_1.runAsync)('DROP TABLE IF EXISTS user_courses');
            yield (0, db_1.runAsync)('DROP TABLE IF EXISTS course_participants');
            yield (0, db_1.runAsync)('DROP TABLE IF EXISTS user_statistics');
            yield (0, db_1.runAsync)('DROP TABLE IF EXISTS productivity_data');
            yield (0, db_1.runAsync)('DROP TABLE IF EXISTS upcoming_events');
            console.log('✅ Removed unused tables');
            console.log('Database schema fixed successfully!');
        }
        catch (error) {
            console.error('Error fixing database schema:', error);
        }
        finally {
            db_1.default.close();
        }
    });
}
fixDatabaseSchema();
