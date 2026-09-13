"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const db_1 = require("./config/db");
const financeRoutes_1 = __importDefault(require("./routes/financeRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 5000);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.json({
        message: 'Finance dashboard backend is running',
        status: 'ok',
    });
});
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api', financeRoutes_1.default);
const startServer = async () => {
    const dbConnected = await (0, db_1.connectDB)();
    if (!dbConnected) {
        console.warn('Server started without a MongoDB connection; API fallback data is enabled.');
    }
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};
startServer();
//# sourceMappingURL=server.js.map