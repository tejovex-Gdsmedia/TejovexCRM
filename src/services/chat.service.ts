import prisma from '../config/database'; // adjust this import to match how you import prisma elsewhere

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface ChatContext {
  entityType?: 'DEAL' | 'LEAD' | 'FOLLOW_UP';
  entityId?: string;
  data?: Record<string, any>;
}

export interface PredictionResult {
  entityType: string;
  entityId: string;
  type: string;
  score?: number;
  label?: string;
  reasoning?: string;
}

export interface ChatResponse {
  reply: string;
  predictions: PredictionResult[];
}

export const sendChatMessage = async (
  message: string,
  context: ChatContext,
  userId: string
): Promise<ChatResponse> => {
const response = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': N8N_WEBHOOK_SECRET,
  },

  body: JSON.stringify({ message, context }),
});



const data = await response.json() as { reply: string; predictions: PredictionResult[] };
const { reply, predictions = [] } = data;

  // Save any returned predictions to DB
  if (predictions.length > 0) {
    await Promise.all(
      predictions.map((p: PredictionResult) =>
        prisma.prediction.upsert({
          where: {
            // upsert based on entityId + type combo
            id: `${p.entityId}_${p.type}`,
          },
          update: {
            score: p.score,
            label: p.label,
            reasoning: p.reasoning,
            updatedAt: new Date(),
          },
          create: {
            id: `${p.entityId}_${p.type}`,
            entityType: p.entityType,
            entityId: p.entityId,
            type: p.type,
            score: p.score,
            label: p.label,
            reasoning: p.reasoning,
            userId,
          },
        })
      )
    );
  }

  return { reply, predictions };
};


export const predictDeal = async (deal: {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage: string;
  follow_up_count?: number;
  days_in_stage?: number;
  has_note?: number;
  has_task?: number;
  assigned?: number;
}) => {
  const response = await fetch(`${ML_SERVICE_URL}/predict/deal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deal),
  });
  return await response.json();
};

export const predictLead = async (lead: {
  id: string;
  title: string;
  value: number;
  source: string;
  follow_up_count?: number;
  days_since_created?: number;
  assigned?: number;
}) => {
  const response = await fetch(`${ML_SERVICE_URL}/predict/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return await response.json();
};

export const predictRevenue = async () => {
  const response = await fetch(`${ML_SERVICE_URL}/predict/revenue`);
  return await response.json();
};