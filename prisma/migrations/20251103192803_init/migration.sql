-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calibration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "neckCoeff" DOUBLE PRECISION NOT NULL DEFAULT 0.37,
    "shouldersCoeff" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
    "chestCoeff" DOUBLE PRECISION NOT NULL DEFAULT 0.72,
    "waistCoeff" DOUBLE PRECISION NOT NULL DEFAULT 1.09,
    "hipsCoeff" DOUBLE PRECISION NOT NULL DEFAULT 0.98,
    "thighCoeff" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "calfCoeff" DOUBLE PRECISION NOT NULL DEFAULT 0.89,
    "bicepCoeff" DOUBLE PRECISION NOT NULL DEFAULT 1.47,
    "isCalibrated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "neck" DOUBLE PRECISION NOT NULL,
    "shoulders" DOUBLE PRECISION NOT NULL,
    "chest" DOUBLE PRECISION NOT NULL,
    "waist" DOUBLE PRECISION NOT NULL,
    "hips" DOUBLE PRECISION NOT NULL,
    "thigh" DOUBLE PRECISION NOT NULL,
    "calf" DOUBLE PRECISION NOT NULL,
    "bicep" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Calibration_userId_key" ON "Calibration"("userId");

-- AddForeignKey
ALTER TABLE "Calibration" ADD CONSTRAINT "Calibration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
