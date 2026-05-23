declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    COMMUNITYOS_DB_FILE?: string;
    DEFAULT_TENANT_ID?: string;
  }
}
