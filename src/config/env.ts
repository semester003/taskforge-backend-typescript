type RequiredEnvironmentVariable = "DATABASE_URL" | "JWT_SECRET";

const getRequiredEnvironmentVariable = (name: RequiredEnvironmentVariable): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

const env = {
  port: process.env.PORT || 5000,
  get jwtSecret(): string {
    return getRequiredEnvironmentVariable("JWT_SECRET");
  },
};

export { env, getRequiredEnvironmentVariable };
