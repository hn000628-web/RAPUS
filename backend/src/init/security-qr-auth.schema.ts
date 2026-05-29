import type Database from 'better-sqlite3'

export function initSecurityQrAuthSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_security_credentials(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channelCode TEXT NOT NULL UNIQUE,
      loginPasswordHash TEXT,
      emergencyAccessCodeHash TEXT,
      qrBaseCode TEXT NOT NULL,
      qrStatus TEXT NOT NULL DEFAULT 'ACTIVE'
      CHECK(qrStatus IN(
        'ACTIVE',
        'DISABLED',
        'LOCKED'
      )),
      qrLastIssuedAt TEXT,
      qrExpiresAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      CHECK(length(qrBaseCode)=12),
      FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
    );

    CREATE TABLE IF NOT EXISTS emergency_qr_tokens(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenId TEXT NOT NULL UNIQUE,
      channelCode TEXT NOT NULL,
      qrTokenHash TEXT NOT NULL,
      tokenType TEXT NOT NULL
      CHECK(tokenType IN(
        'MASTER_ACCESS',
        'GUARDIAN_ACCESS',
        'EMERGENCY_LOGIN'
      )),
      status TEXT NOT NULL DEFAULT 'ACTIVE'
      CHECK(status IN(
        'ACTIVE',
        'USED',
        'EXPIRED',
        'REVOKED'
      )),
      expiresAt TEXT NOT NULL,
      usedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
    );

    CREATE TABLE IF NOT EXISTS emergency_access_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logId TEXT NOT NULL UNIQUE,
      actorChannelCode TEXT NOT NULL,
      accessType TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      metadata TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(actorChannelCode) REFERENCES profiles(channelCode)
    );

    CREATE INDEX IF NOT EXISTS idx_user_security_credentials_channel
    ON user_security_credentials(channelCode);

    CREATE INDEX IF NOT EXISTS idx_emergency_qr_tokens_channel
    ON emergency_qr_tokens(channelCode);

    CREATE INDEX IF NOT EXISTS idx_emergency_qr_tokens_token_id
    ON emergency_qr_tokens(tokenId);

    CREATE INDEX IF NOT EXISTS idx_emergency_qr_tokens_status
    ON emergency_qr_tokens(status);

    CREATE INDEX IF NOT EXISTS idx_emergency_qr_tokens_expires
    ON emergency_qr_tokens(expiresAt);

    CREATE INDEX IF NOT EXISTS idx_emergency_access_logs_actor
    ON emergency_access_logs(actorChannelCode);

    CREATE INDEX IF NOT EXISTS idx_emergency_access_logs_type
    ON emergency_access_logs(accessType);

    CREATE INDEX IF NOT EXISTS idx_emergency_access_logs_created
    ON emergency_access_logs(createdAt);
  `)

  const credentialColumns =
    db.prepare(`PRAGMA table_info(user_security_credentials)`).all() as Array<{ name: string }>
  const hasQrStatus =
    credentialColumns.some((column) => column.name === 'qrStatus')
  const hasQrLastIssuedAt =
    credentialColumns.some((column) => column.name === 'qrLastIssuedAt')
  const hasQrExpiresAt =
    credentialColumns.some((column) => column.name === 'qrExpiresAt')

  if (!hasQrStatus) {
    db.exec(`
      ALTER TABLE user_security_credentials
      ADD COLUMN qrStatus TEXT NOT NULL DEFAULT 'ACTIVE'
      CHECK(qrStatus IN(
        'ACTIVE',
        'DISABLED',
        'LOCKED'
      ));
    `)
  }

  if (!hasQrLastIssuedAt) {
    db.exec(`
      ALTER TABLE user_security_credentials
      ADD COLUMN qrLastIssuedAt TEXT;
    `)
  }

  if (!hasQrExpiresAt) {
    db.exec(`
      ALTER TABLE user_security_credentials
      ADD COLUMN qrExpiresAt TEXT;
    `)
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_security_credentials_qr_status
    ON user_security_credentials(qrStatus);

    CREATE INDEX IF NOT EXISTS idx_user_security_credentials_qr_expires
    ON user_security_credentials(qrExpiresAt);
  `)
}
