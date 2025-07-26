declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
    PORT: string;
    STRIPE_SECRET_KEY: string;
    JWT_SECRET: string;
  }
}