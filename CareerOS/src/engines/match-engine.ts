import { Candidate, CandidateMatch, CandidateResume, JobRequisition } from "../core/domain";
import { clamp, clone, normalizeSkill } from "../core/utils";

export class MatchEngine {
  score(job: JobRequisition, candidate: Candidate, resume?: CandidateResume): CandidateMatch {
    const candidateSkills = new Set([...candidate.skills, ...(resume?.parsedSkills ?? [])].map(normalizeSkill));
    const required = job.requiredSkills.map(normalizeSkill);
    const nice = job.niceToHaveSkills.map(normalizeSkill);
    const matchedSkills = required.filter((skill) => candidateSkills.has(skill));
    const matchedNice = nice.filter((skill) => candidateSkills.has(skill));
    const missingSkills = required.filter((skill) => !candidateSkills.has(skill));

    const requiredScore = required.length === 0 ? 50 : (matchedSkills.length / required.length) * 65;
    const niceScore = nice.length === 0 ? 10 : Math.min(15, (matchedNice.length / nice.length) * 15);
    const experience = resume?.experienceYears ?? candidate.experienceYears;
    const experienceScore = this.experienceScore(job, experience);
    const sourceScore = candidate.consentStatus === "granted" && candidate.status === "active" ? 5 : 0;
    const score = Math.round(clamp(requiredScore + niceScore + experienceScore + sourceScore, 0, 100));

    const reasons: string[] = [];
    reasons.push(`${matchedSkills.length}/${required.length} required skills matched`);
    if (matchedNice.length) reasons.push(`${matchedNice.length} nice-to-have skills matched`);
    reasons.push(`Experience: ${experience} years`);
    if (missingSkills.length) reasons.push(`Missing: ${missingSkills.join(", ")}`);
    if (candidate.consentStatus !== "granted") reasons.push("Candidate consent is not granted");

    return clone({ candidate, resume, score, matchedSkills, missingSkills, reasons });
  }

  private experienceScore(job: JobRequisition, experienceYears: number): number {
    if (experienceYears < job.experienceMinYears) {
      const gap = job.experienceMinYears - experienceYears;
      return Math.max(0, 20 - gap * 6);
    }
    if (job.experienceMaxYears !== undefined && experienceYears > job.experienceMaxYears + 5) return 12;
    return 20;
  }
}
