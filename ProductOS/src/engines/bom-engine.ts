import { BOMLine, Component } from "../core/domain";
import { badRequest, notFound } from "../core/errors";
import { numberOrZero, roundMoney } from "../core/utils";
export interface BOMLineInput { componentId?: string; quantity?: number; }
export class BOMEngine {
  static buildLines(inputs: BOMLineInput[], components: Component[]): { lines: BOMLine[]; totalCost: number; currency: string } {
    if (!Array.isArray(inputs) || inputs.length === 0) badRequest("BOM lines are required");
    const lines = inputs.map((input) => {
      const componentId = String(input.componentId ?? "");
      const component = components.find((candidate) => candidate.id === componentId);
      if (!component) notFound("Component not found", { componentId });
      const quantity = numberOrZero(input.quantity);
      if (quantity <= 0) badRequest("BOM line quantity must be greater than zero", { componentId });
      return { componentId: component.id, sku: component.sku, name: component.name, quantity, unit: component.unit, unitCost: component.unitCost, totalCost: roundMoney(quantity * component.unitCost) };
    });
    const currency = components.find((component) => component.id === lines[0]?.componentId)?.currency ?? "INR";
    const totalCost = roundMoney(lines.reduce((sum, line) => sum + line.totalCost, 0));
    return { lines, totalCost, currency };
  }
}
