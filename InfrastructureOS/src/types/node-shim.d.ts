declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    INFRASTRUCTUREOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
