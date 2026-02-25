-- CreateTable
CREATE TABLE "Champion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "winrate" REAL NOT NULL,
    "pickRate" REAL NOT NULL,
    "banRate" REAL NOT NULL,
    "tier" TEXT NOT NULL,
    "damageProfileAd" REAL NOT NULL DEFAULT 0,
    "damageProfileAp" REAL NOT NULL DEFAULT 0,
    "damageProfileTrue" REAL NOT NULL DEFAULT 0,
    "durabilityScore" REAL NOT NULL DEFAULT 0,
    "engageScore" REAL NOT NULL DEFAULT 0,
    "peelScore" REAL NOT NULL DEFAULT 0,
    "ccScore" REAL NOT NULL DEFAULT 0,
    "scalingScore" REAL NOT NULL DEFAULT 0,
    "earlyGameScore" REAL NOT NULL DEFAULT 0,
    "mobilityScore" REAL NOT NULL DEFAULT 0,
    "healingScore" REAL NOT NULL DEFAULT 0,
    "shieldScore" REAL NOT NULL DEFAULT 0,
    "waveclearScore" REAL NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CounterMatchup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "championId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "CounterMatchup_championId_fkey" FOREIGN KEY ("championId") REFERENCES "Champion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CounterMatchup_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Champion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataMeta" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "lastScrapedAt" DATETIME NOT NULL,
    "championCount" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0'
);

-- CreateIndex
CREATE UNIQUE INDEX "Champion_name_key" ON "Champion"("name");

-- CreateIndex
CREATE INDEX "CounterMatchup_championId_idx" ON "CounterMatchup"("championId");

-- CreateIndex
CREATE INDEX "CounterMatchup_opponentId_idx" ON "CounterMatchup"("opponentId");

-- CreateIndex
CREATE UNIQUE INDEX "CounterMatchup_championId_opponentId_key" ON "CounterMatchup"("championId", "opponentId");
