declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    PARTNEROS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
