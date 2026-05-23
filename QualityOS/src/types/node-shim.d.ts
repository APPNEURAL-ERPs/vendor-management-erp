declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    QUALITYOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
