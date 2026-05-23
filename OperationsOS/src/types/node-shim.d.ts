declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    OPERATIONSOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
