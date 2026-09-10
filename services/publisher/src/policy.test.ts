import { describe, expect, it } from "vitest";
import { editorialGate } from "./policy.js";

describe("editorialGate", () => {
  it("rejects duplicates", () => expect(editorialGate({confidence:0.99,duplicateScore:0.9,risk:"low",sourceCount:3})).toBe("reject"));
  it("routes high risk to humans", () => expect(editorialGate({confidence:0.99,duplicateScore:0.1,risk:"high",sourceCount:3})).toBe("human_review"));
  it("allows verified low risk stories", () => expect(editorialGate({confidence:0.9,duplicateScore:0.1,risk:"low",sourceCount:2})).toBe("auto_publish"));
});
