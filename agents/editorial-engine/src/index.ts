import Fastify from "fastify";
import { timingSafeEqual } from "node:crypto";
import { agentNames, type AgentRequest } from "./types.js";
import { getProviderStatus, runAgent } from "./runner.js";

const app = Fastify({ logger:true });
function authorized(value?:string){const expected=process.env.AGENT_SERVICE_TOKEN;if(!expected||!value?.startsWith("Bearer "))return false;const a=Buffer.from(expected),b=Buffer.from(value.slice(7));return a.length===b.length&&timingSafeEqual(a,b);}

app.get("/health",async()=>{
  try {
    const status=getProviderStatus();
    return {
      service:"p360-editorial-engine",
      status:"ok",
      provider:status.provider,
      requestedProvider:status.requested,
      model:status.model,
      configured:status.configured
    };
  } catch (error) {
    return {
      service:"p360-editorial-engine",
      status:"configuration_error",
      configured:false,
      error:error instanceof Error?error.message:"invalid provider configuration"
    };
  }
});
app.post("/v1/agents/:agent",async(request,reply)=>{
  if(!authorized(request.headers.authorization))return reply.code(401).send({error:"unauthorized"});
  const agent=(request.params as {agent:string}).agent;
  if(!agentNames.includes(agent as any))return reply.code(404).send({error:"unknown_agent"});
  const body=request.body as Omit<AgentRequest,"agent">;
  try{return await runAgent({...body,agent:agent as AgentRequest["agent"]});}catch(error){request.log.error({err:error,workflowId:body.workflowId,agent},"agent failed");return reply.code(502).send({error:"agent_failed",agent});}
});

app.listen({port:Number(process.env.PORT??3002),host:"0.0.0.0"}).catch(error=>{app.log.error(error);process.exit(1);});
