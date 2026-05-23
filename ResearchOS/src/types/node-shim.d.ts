declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    RESEARCHOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
