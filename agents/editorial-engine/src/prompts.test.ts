import { describe,expect,it } from "vitest";
import { agentNames } from "./types.js";
import { prompts } from "./prompts.js";

describe("prompts",()=>{
  it("covers every editorial agent",()=>expect(Object.keys(prompts).sort()).toEqual([...agentNames].sort()));
  it("forbids fabrication for every agent",()=>{for(const prompt of Object.values(prompts))expect(prompt).toContain("Never invent facts")});
});
