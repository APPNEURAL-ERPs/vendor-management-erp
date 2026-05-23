declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    COMMANDOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
