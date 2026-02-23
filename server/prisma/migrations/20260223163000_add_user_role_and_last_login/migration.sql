-- Create enum for user roles
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Add role and last login to existing users
ALTER TABLE "User"
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN "lastLogin" TIMESTAMP(3);
