import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";
import { agentNames, type AgentRequest } from "./types.js";
import { runAgent } from "./runner.js";

const app = Fastify({ logger:true });
function authorized(value?:string){const expected=process.env.AGENT_SERVICE_TOKEN;if(!expected||!value?.startsWith("Bearer "))return false;const a=Buffer.from(expected),b=Buffer.from(value.slice(7));return a.length===b.length&&timingSafeEqual(a,b);}

app.get("/health",async()=>({service:"p360-editorial-engine",status:"ok",model:process.env.OPENAI_EDITORIAL_MODEL??"gpt-5.6",configured:Boolean(process.env.OPENAI_API_KEY)}));
app.post("/v1/agents/:agent",async(request,reply)=>{
  if(!authorized(request.headers.authorization))return reply.code(401).send({error:"unauthorized"});
  const agent=(request.params as {agent:string}).agent;
  if(!agentNames.includes(agent as any))return reply.code(404).send({error:"unknown_agent"});
  const body=request.body as Omit<AgentRequest,"agent">;
  try{return await runAgent({...body,agent:agent as AgentRequest["agent"]});}catch(error){request.log.error({err:error,workflowId:body.workflowId,agent},"agent failed");return reply.code(502).send({error:"agent_failed",agent});}
});

app.listen({port:Number(process.env.PORT??3002),host:"0.0.0.0"}).catch(error=>{app.log.error(error);process.exit(1);});
