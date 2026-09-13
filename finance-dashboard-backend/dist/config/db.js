"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }
        await mongoose_1.default.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully');
        return true;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        return false;
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map