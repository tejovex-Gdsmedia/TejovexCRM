import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL as string,
};

// Safety check — crash early if critical env vars are missing
if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is not set in .env file');
}