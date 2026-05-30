/**
 * AI Service - DeepSeek API integration with Function Calling
 * Adapted for Cloudflare Workers + D1
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

/**
 * Create AI service instance from env
 */
export function createAIService(env: { DEEPSEEK_API_KEY: string; DEEPSEEK_BASE_URL: string }): AIService {
  return new AIService(env.DEEPSEEK_API_KEY, env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com');
}

/**
 * AI Service class
 */
class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  /**
   * Create chat completion with SSE streaming
   */
  async createChatCompletion(
    messages: ChatMessage[],
    tools?: Tool[],
    onChunk?: (chunk: string) => void
  ): Promise<ReadableStream> {
    const requestBody: Record<string, unknown> = {
      model: 'deepseek-chat',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      })),
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Process SSE stream
    return this.processSSEStream(response.body, onChunk);
  }

  /**
   * Process SSE (Server-Sent Events) stream
   */
  private processSSEStream(
    body: ReadableStream<Uint8Array>,
    onChunk?: (chunk: string) => void
  ): ReadableStream<Uint8Array> {
    const decoder = new TextDecoder();
    let buffer = '';

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.terminate();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              if (content && onChunk) {
                onChunk(content);
              }

              // Forward chunk to client
              const chunkData = `data: ${JSON.stringify(parsed)}\n\n`;
              controller.enqueue(new TextEncoder().encode(chunkData));
            } catch (e) {
              console.error('SSE parse error:', e);
              // Skip malformed chunks
            }
          }
        }
      },

      flush(controller) {
        if (buffer) {
          controller.enqueue(new TextEncoder().encode(buffer));
        }
        controller.terminate();
      },
    });

    return body.pipeThrough(transformStream);
  }

  /**
   * Get available tools for function calling
   */
  getAvailableTools(): Tool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'create_workout_plan',
          description: 'Create a workout plan for the user',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Workout plan title' },
              description: { type: 'string', description: 'Plan description' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exercise_id: { type: 'string', description: 'Exercise ID (UUID string)' },
                    sets: { type: 'number', description: 'Number of sets' },
                    reps: { type: 'number', description: 'Number of reps per set' },
                    weight: { type: 'number', description: 'Weight in kg (optional)' },
                  },
                },
              },
            },
            required: ['title', 'exercises'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'log_workout',
          description: 'Log a workout session',
          parameters: {
            type: 'object',
            properties: {
              workout_plan_id: { type: 'string', description: 'Workout plan ID (optional)' },
              duration_minutes: { type: 'number', description: 'Workout duration in minutes' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exercise_id: { type: 'string', description: 'Exercise ID (UUID string)' },
                    sets_completed: { type: 'number', description: 'Sets completed' },
                    reps_completed: { type: 'number', description: 'Reps completed' },
                    weight_used: { type: 'number', description: 'Weight used in kg' },
                  },
                },
              },
            },
            required: ['exercises'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_exercises',
          description: 'Search exercises by name or muscle group',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              muscle_group: { type: 'string', description: 'Muscle group filter (optional)' },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  /**
   * Execute function call
   */
  async executeFunction(
    functionName: string,
    args: Record<string, unknown>,
    db: D1Database,
    userId: string
  ): Promise<string> {
    switch (functionName) {
      case 'create_workout_plan':
        return this.createWorkoutPlan(db, userId, args);
      case 'log_workout':
        return this.logWorkout(db, userId, args);
      case 'search_exercises':
        return this.searchExercises(db, args);
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  private async createWorkoutPlan(
    db: D1Database,
    userId: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const title = args.title as string;
    const description = (args.description as string) || '';
    const exercises = args.exercises as Array<Record<string, number>>;

    if (!title || !exercises || !Array.isArray(exercises)) {
      throw new Error('Invalid arguments: title and exercises array are required');
    }

    const planId = crypto.randomUUID();

    await db.prepare(
      'INSERT INTO workout_plans (id, user_id, name, description) VALUES (?, ?, ?, ?)'
    ).bind(planId, userId, title, description).run();

    for (const ex of exercises) {
      if (!ex.exercise_id || !ex.sets || !ex.reps) continue;

      await db.prepare(
        'INSERT INTO workout_plan_exercises (id, plan_id, exercise_id, sets, reps, weight) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        crypto.randomUUID(),
        planId,
        ex.exercise_id,
        ex.sets,
        ex.reps,
        (ex.weight ?? null) as number | null
      ).run();
    }

    return `Workout plan "${title}" created successfully with ${exercises.length} exercises.`;
  }

  private async logWorkout(
    db: D1Database,
    userId: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const workout_plan_id = args.workout_plan_id as string | undefined;
    const duration_minutes = (args.duration_minutes as number) || 0;
    const exercises = args.exercises as Array<Record<string, number>>;

    if (!exercises || !Array.isArray(exercises)) {
      throw new Error('Invalid arguments: exercises array is required');
    }

    const logId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await db.prepare(
      'INSERT INTO workout_logs (id, user_id, plan_id, date, duration_minutes) VALUES (?, ?, ?, ?, ?)'
    ).bind(logId, userId, workout_plan_id || null, now, duration_minutes).run();

    for (const ex of exercises) {
      if (!ex.exercise_id || !ex.sets_completed || !ex.reps_completed) continue;

      const leId = crypto.randomUUID();
      await db.prepare(
        'INSERT INTO workout_log_exercises (id, log_id, exercise_id, notes) VALUES (?, ?, ?, ?)'
      ).bind(leId, logId, ex.exercise_id, '').run();

      // No workout_log_sets table in current schema - skip sets logging
    }

    return `Workout logged successfully with ${exercises.length} exercises.`;
  }

  private async searchExercises(
    db: D1Database,
    args: Record<string, unknown>
  ): Promise<string> {
    const query = args.query as string;
    const muscle_group = args.muscle_group as string | undefined;

    if (!query || typeof query !== 'string') {
      throw new Error('Invalid arguments: query string is required');
    }

    let sql = 'SELECT * FROM exercises WHERE name LIKE ?';
    const params: unknown[] = [`%${query}%`];

    if (muscle_group) {
      sql += ' AND muscle_group = ?';
      params.push(muscle_group);
    }

    sql += ' LIMIT 10';

    const result = await db.prepare(sql).bind(...params).all();
    return JSON.stringify((result as any).results || []);
  }
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
