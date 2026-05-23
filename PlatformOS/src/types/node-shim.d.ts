declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    PLATFORMOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
