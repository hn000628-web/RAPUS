import type Database from 'better-sqlite3'

export function initWalletLedgerSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      walletId TEXT NOT NULL UNIQUE,
      channelCode TEXT NOT NULL,
      balance BIGINT NOT NULL DEFAULT 0
      CHECK(balance >= 0),
      assetType TEXT NOT NULL
      CHECK(assetType IN(
        'SYSTEM_TEST_ASSET'
      )),
      status TEXT NOT NULL DEFAULT 'ACTIVE'
      CHECK(status IN(
        'ACTIVE',
        'LOCKED',
        'DISABLED'
      )),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
    );

    CREATE TABLE IF NOT EXISTS wallet_ledger(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId TEXT NOT NULL UNIQUE,
      walletId TEXT NOT NULL,
      channelCode TEXT NOT NULL,
      ledgerType TEXT NOT NULL
      CHECK(ledgerType IN(
        'SYSTEM_TEST_ASSET_GRANT',
        'SYSTEM_TEST_ASSET_DEBIT',
        'SYSTEM_TEST_ASSET_ADJUST'
      )),
      amount BIGINT NOT NULL
      CHECK(amount > 0),
      balanceAfter BIGINT NOT NULL
      CHECK(balanceAfter >= 0),
      assetType TEXT NOT NULL
      CHECK(assetType IN(
        'SYSTEM_TEST_ASSET'
      )),
      isSandbox INTEGER NOT NULL DEFAULT 1
      CHECK(isSandbox IN(0,1)),
      memo TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(walletId) REFERENCES wallets(walletId),
      FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_channel_asset
    ON wallets(channelCode, assetType);

    CREATE INDEX IF NOT EXISTS idx_wallets_channel
    ON wallets(channelCode);

    CREATE INDEX IF NOT EXISTS idx_wallets_asset_type
    ON wallets(assetType);

    CREATE INDEX IF NOT EXISTS idx_wallets_status
    ON wallets(status);

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet
    ON wallet_ledger(walletId);

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_channel
    ON wallet_ledger(channelCode);

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_asset_type
    ON wallet_ledger(assetType);

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_type
    ON wallet_ledger(ledgerType);

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_sandbox
    ON wallet_ledger(isSandbox);

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created
    ON wallet_ledger(createdAt);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_ledger_system_test_grant_once
    ON wallet_ledger(channelCode, assetType, ledgerType, memo)
    WHERE assetType = 'SYSTEM_TEST_ASSET'
      AND ledgerType = 'SYSTEM_TEST_ASSET_GRANT'
      AND memo = '시스템 테스트용 상징 자산';
  `)
}
