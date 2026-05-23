declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    AGENTICOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
