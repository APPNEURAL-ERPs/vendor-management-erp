declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    LEGALOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
