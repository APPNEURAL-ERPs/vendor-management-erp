import { Offer, OfferApproval } from "../core/domain";

export class OfferEngine {
  isFullyApproved(approvals: OfferApproval[]): boolean {
    return approvals.length === 0 || approvals.every((approval) => approval.status === "approved");
  }

  hasRejectedApproval(approvals: OfferApproval[]): boolean {
    return approvals.some((approval) => approval.status === "rejected");
  }

  nextStatusAfterApproval(offer: Offer): Offer["status"] {
    if (this.hasRejectedApproval(offer.approvals)) return "draft";
    if (this.isFullyApproved(offer.approvals)) return "approved";
    return "pending_approval";
  }
}
