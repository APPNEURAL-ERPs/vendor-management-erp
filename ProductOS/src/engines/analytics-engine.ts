import { ProductAnalytics, ProductState } from "../core/domain";
import { roundMoney } from "../core/utils";
export class AnalyticsEngine {
  static calculate(state: ProductState, tenantId: string): ProductAnalytics {
    const products = state.products.filter((x) => x.tenantId === tenantId);
    const roadmap = state.roadmapItems.filter((x) => x.tenantId === tenantId);
    const features = state.features.filter((x) => x.tenantId === tenantId);
    const backlog = state.backlogItems.filter((x) => x.tenantId === tenantId);
    const releases = state.releases.filter((x) => x.tenantId === tenantId);
    const activeBoms = state.boms.filter((x) => x.tenantId === tenantId && ["approved", "active"].includes(x.status));
    const totalBomCost = roundMoney(activeBoms.reduce((sum, bom) => sum + bom.totalCost, 0));
    return {
      productCount: products.length,
      activeProducts: products.filter((product) => product.status === "active").length,
      launchedProducts: products.filter((product) => ["launched", "growth", "mature"].includes(product.lifecycleStage)).length,
      roadmapOpen: roadmap.filter((item) => !["done", "cancelled"].includes(item.status)).length,
      roadmapDone: roadmap.filter((item) => item.status === "done").length,
      openFeatures: features.filter((feature) => !["released", "cancelled"].includes(feature.status)).length,
      releasedFeatures: features.filter((feature) => feature.status === "released").length,
      backlogOpen: backlog.filter((item) => !["done", "cancelled"].includes(item.status)).length,
      releasesPlanned: releases.filter((release) => ["draft", "approved", "scheduled"].includes(release.status)).length,
      releasesCompleted: releases.filter((release) => release.status === "released").length,
      totalBomCost,
      averageFeatureValue: features.length === 0 ? 0 : roundMoney(features.reduce((sum, feature) => sum + feature.valueScore, 0) / features.length),
      averageFeatureRisk: features.length === 0 ? 0 : roundMoney(features.reduce((sum, feature) => sum + feature.riskScore, 0) / features.length)
    };
  }
}
