import { RequestActor } from "../core/domain";
import { newId } from "../core/id";

export interface CommandRunResult {
  command: string;
  executionId: string;
  output: Record<string, unknown>;
}

export class CommandGateway {
  run(command: string, input: unknown, actor: RequestActor): CommandRunResult {
    return {
      command,
      executionId: newId("cmdexec"),
      output: {
        ok: true,
        command,
        input,
        actorId: actor.userId,
        simulatedBy: "CommandOS gateway"
      }
    };
  }
}
