declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    INTEGRATIONOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
