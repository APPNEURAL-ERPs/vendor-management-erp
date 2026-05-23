declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    CONTENTOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
