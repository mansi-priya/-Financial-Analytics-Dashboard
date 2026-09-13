"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const User_1 = __importDefault(require("./models/User"));
const Transaction_1 = __importDefault(require("./models/Transaction"));
dotenv_1.default.config();
const categories = [
    'Sales',
    'Marketing',
    'Utilities',
    'Salaries',
    'Rent',
    'Software',
    'Travel',
    'Consulting',
    'Other',
];
const statuses = [
    'completed',
    'pending',
    'failed',
];
const users = [
    'Aditi Sharma',
    'Rohan Mehta',
    'Priya Nair',
    'Karan Verma',
    'Sneha Iyer',
];
const descriptions = [
    'Monthly invoice payment',
    'Client project payment',
    'Office supplies purchase',
    'Software subscription renewal',
    'Employee salary disbursement',
    'Office rent payment',
    'Marketing campaign spend',
    'Business travel expense',
    'Consulting service fee',
    'Utility bill payment',
];
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomDateInLast6Months() {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 6);
    const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(randomTime);
}
function generateTransactions(count) {
    const transactions = [];
    for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.5 ? 'revenue' : 'expense';
        const amount = type === 'revenue'
            ? Math.floor(Math.random() * 90000) + 10000 // 10,000 - 100,000
            : Math.floor(Math.random() * 50000) + 1000; // 1,000 - 51,000
        transactions.push({
            date: randomDateInLast6Months(),
            amount,
            type,
            category: randomItem(categories),
            status: randomItem(statuses),
            user: randomItem(users),
            description: randomItem(descriptions),
        });
    }
    return transactions;
}
const seedDatabase = async () => {
    try {
        await (0, db_1.connectDB)();
        // Clear existing data
        await User_1.default.deleteMany({});
        await Transaction_1.default.deleteMany({});
        console.log('🗑️  Old data cleared');
        // Create a default admin user for login testing
        await User_1.default.create({
            name: 'Admin User',
            email: 'admin@financedash.com',
            password: 'Admin@123', // will be hashed automatically
            role: 'admin',
        });
        console.log('👤 Default user created -> email: admin@financedash.com | password: Admin@123');
        // Generate and insert 150 sample transactions
        const transactions = generateTransactions(150);
        await Transaction_1.default.insertMany(transactions);
        console.log(`💰 ${transactions.length} sample transactions inserted`);
        console.log('✅ Database seeding completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};
seedDatabase();
//# sourceMappingURL=seed.js.map