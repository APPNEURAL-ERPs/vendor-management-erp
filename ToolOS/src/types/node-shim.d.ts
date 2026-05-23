declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    TOOLOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
