"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_db_1 = require("../src/init/init-db");
async function resetDB() {
    try {
        console.log('===== RESETTING PRODUCTION DB =====');
        await (0, init_db_1.initDatabase)();
        console.log('PRODUCTION DB RESET COMPLETE');
    }
    catch (err) {
        console.error('PRODUCTION DB RESET FAILED', err);
        process.exit(1);
    }
}
resetDB();
//# sourceMappingURL=db-reset.js.map