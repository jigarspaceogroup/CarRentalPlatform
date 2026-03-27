-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_id" UUID NOT NULL,
    "refresh_token" VARCHAR(512) NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_sessions_refresh_token_key" ON "staff_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_staff_sessions_staff_id" ON "staff_sessions"("staff_id");

-- CreateIndex
CREATE INDEX "idx_staff_sessions_refresh_token" ON "staff_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_staff_sessions_expires_at" ON "staff_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
