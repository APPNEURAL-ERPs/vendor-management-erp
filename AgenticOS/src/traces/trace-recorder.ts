import { AgentDefinition, AgentTrace, AgentTraceEntry, RequestActor } from "../core/domain";
import { newId, nowIso } from "../core/id";
import { clone } from "../core/utils";
import { DataStore } from "../core/datastore";

export class TraceRecorder {
  constructor(private readonly store: DataStore) {}

  start(actor: RequestActor, agent: AgentDefinition, runId: string): AgentTrace {
    const now = nowIso();
    const trace: AgentTrace = {
      id: newId("trace"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      runId,
      agentId: agent.id,
      entries: [],
      cost: 0
    };
    this.store.getState().traces.unshift(trace);
    this.add(trace.id, "run.started", `Agent ${agent.id} started`, { runId, model: agent.model });
    return clone(trace);
  }

  add(traceId: string, type: string, message: string, data: Record<string, unknown> = {}): AgentTraceEntry {
    const trace = this.store.getState().traces.find((item) => item.id === traceId);
    if (!trace) throw new Error("Trace not found");
    const entry: AgentTraceEntry = {
      id: newId("traceentry"),
      at: nowIso(),
      type,
      message,
      data
    };
    trace.entries.push(entry);
    trace.updatedAt = entry.at;
    this.store.save();
    return clone(entry);
  }

  complete(traceId: string, summary: string, cost: number, latencyMs: number): AgentTrace {
    const trace = this.store.getState().traces.find((item) => item.id === traceId);
    if (!trace) throw new Error("Trace not found");
    trace.summary = summary;
    trace.cost = cost;
    trace.latencyMs = latencyMs;
    trace.updatedAt = nowIso();
    this.store.save();
    return clone(trace);
  }

  getByRun(actor: RequestActor, runId: string): AgentTrace {
    const trace = this.store.getState().traces.find((item) => item.tenantId === actor.tenantId && item.runId === runId);
    if (!trace) throw new Error("Trace not found");
    return clone(trace);
  }
}
