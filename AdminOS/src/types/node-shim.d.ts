declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    ADMINOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
