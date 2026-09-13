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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TransactionSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['revenue', 'expense'], required: true },
    category: {
        type: String,
        required: true,
        enum: [
            'Sales',
            'Marketing',
            'Utilities',
            'Salaries',
            'Rent',
            'Software',
            'Travel',
            'Consulting',
            'Other',
        ],
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'completed',
    },
    user: { type: String, required: true },
    description: { type: String, default: '' },
}, { timestamps: true });
// Indexes for fast filtering/sorting/searching
TransactionSchema.index({ date: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ amount: 1 });
TransactionSchema.index({ description: 'text' });
exports.default = mongoose_1.default.model('Transaction', TransactionSchema);
//# sourceMappingURL=Transaction.js.map