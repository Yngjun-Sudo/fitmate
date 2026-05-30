/**
 * AI Service - DeepSeek API integration with Function Calling
 * Migrated from original FitMate AI chat logic
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

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}

/**
 * AI Service class for DeepSeek API integration
 */
export class AIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey: string, baseURL: string, model?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = model || 'deepseek-chat';
  }

  /**
   * Create chat completion with streaming support
   */
  async createChatCompletion(
    messages: ChatMessage[],
    tools?: Tool[],
    onChunk?: (chunk: string) => void
  ): Promise<ReadableStream<Uint8Array>> {
    const requestBody: ChatCompletionRequest = {
      model: this.model,
      messages,
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
      async transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              controller.terminate();
              return;
            }

            try {
              const parsed: StreamChunk = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content && onChunk) {
                onChunk(content);
              }

              // Forward the chunk to client
              const chunkData = `data: ${JSON.stringify(parsed)}\n\n`;
              controller.enqueue(new TextEncoder().encode(chunkData));
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
              // Skip malformed chunks instead of breaking
              continue;
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
                    exercise_id: { type: 'number', description: 'Exercise ID' },
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
              workout_plan_id: { type: 'number', description: 'Workout plan ID' },
              duration_minutes: { type: 'number', description: 'Workout duration in minutes' },
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exercise_id: { type: 'number', description: 'Exercise ID' },
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
    userId: number
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
    userId: number,
    args: Record<string, unknown>
  ): Promise<string> {
    const { title, description, exercises } = args;

    if (!title || !exercises || !Array.isArray(exercises)) {
      throw new Error('Invalid arguments: title and exercises array are required');
    }

    // Create workout plan
    const planResult = await db
      .prepare(
        'INSERT INTO workout_plans (user_id, title, description) VALUES (?, ?, ?) RETURNING id'
      )
      .bind(userId, String(title), description ? String(description) : null)
      .first<{ id: number }>();

    if (!planResult) {
      throw new Error('Failed to create workout plan');
    }

    const planId = planResult.id;

    // Add exercises to plan
    for (const ex of exercises as Array<Record<string, number>>) {
      if (!ex.exercise_id || !ex.sets || !ex.reps) {
        console.warn('Skipping invalid exercise:', ex);
        continue;
      }

      await db
        .prepare(
          'INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, weight) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(planId, ex.exercise_id, ex.sets, ex.reps, ex.weight ?? null)
        .run();
    }

    return `Workout plan "${title}" created successfully with ${exercises.length} exercises.`;
  }

  private async logWorkout(
    db: D1Database,
    userId: number,
    args: Record<string, unknown>
  ): Promise<string> {
    const { workout_plan_id, duration_minutes, exercises } = args;

    if (!exercises || !Array.isArray(exercises)) {
      throw new Error('Invalid arguments: exercises array is required');
    }

    // Create workout log
    const logResult = await db
      .prepare(
        'INSERT INTO workout_logs (user_id, workout_plan_id, duration_minutes) VALUES (?, ?, ?) RETURNING id'
      )
      .bind(userId, workout_plan_id ? Number(workout_plan_id) : null, duration_minutes ? Number(duration_minutes) : null)
      .first<{ id: number }>();

    if (!logResult) {
      throw new Error('Failed to create workout log');
    }

    const logId = logResult.id;

    // Add exercise logs
    for (const ex of exercises as Array<Record<string, number>>) {
      if (!ex.exercise_id || !ex.sets_completed || !ex.reps_completed) {
        console.warn('Skipping invalid exercise log:', ex);
        continue;
      }

      await db
        .prepare(
          'INSERT INTO workout_log_exercises (workout_log_id, exercise_id, sets_completed, reps_completed, weight_used) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(logId, ex.exercise_id, ex.sets_completed, ex.reps_completed, ex.weight_used ?? null)
        .run();
    }

    return `Workout logged successfully with ${exercises.length} exercises.`;
  }

  private async searchExercises(
    db: D1Database,
    args: Record<string, unknown>
  ): Promise<string> {
    const { query, muscle_group } = args;

    if (!query || typeof query !== 'string') {
      throw new Error('Invalid arguments: query string is required');
    }

    let sql = 'SELECT * FROM exercises WHERE name LIKE ?';
    const params: unknown[] = [`%${query}%`];

    if (muscle_group && typeof muscle_group === 'string') {
      sql += ' AND muscle_group = ?';
      params.push(muscle_group);
    }

    sql += ' LIMIT 10';

    const exercises = await db.prepare(sql).bind(...params).all();

    return JSON.stringify(exercises.results);
  }
}

/**
 * Create AI service instance from environment
 */
export function createAIService(env: { DEEPSEEK_API_KEY: string; DEEPSEEK_BASE_URL: string; DEEPSEEK_MODEL?: string }): AIService {
  return new AIService(env.DEEPSEEK_API_KEY, env.DEEPSEEK_BASE_URL, env.DEEPSEEK_MODEL);
}
