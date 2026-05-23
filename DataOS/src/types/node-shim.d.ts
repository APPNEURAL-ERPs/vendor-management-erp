declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    DATAOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
