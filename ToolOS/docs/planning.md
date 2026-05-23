# ToolOS Planning

ToolOS owns reusable tools that agents and workflows can call safely.

## Runtime Flow

1. Register tool definition.
2. Check caller permission.
3. Validate tool status and policy.
4. Pause for approval if risk or policy requires it.
5. Execute through the tool adapter.
6. Record output, events, and audit logs.

AgenticOS should call tools through ToolOS rather than invoking implementation packages directly.
