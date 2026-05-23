import { RequestActor } from "../core/domain";
import { newId } from "../core/id";

export interface ToolCallResult {
  tool: string;
  callId: string;
  output: Record<string, unknown>;
}

export class ToolGateway {
  call(tool: string, input: unknown, actor: RequestActor): ToolCallResult {
    return {
      tool,
      callId: newId("toolcall"),
      output: {
        ok: true,
        tool,
        input,
        actorId: actor.userId,
        simulatedBy: "ToolOS gateway"
      }
    };
  }
}
