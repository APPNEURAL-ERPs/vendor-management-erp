declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    COMPLIANCEOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
