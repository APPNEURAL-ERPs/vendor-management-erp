declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    KNOWLEDGEOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
