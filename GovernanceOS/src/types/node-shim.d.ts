declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    GOVERNANCEOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
