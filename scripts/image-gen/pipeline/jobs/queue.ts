import type { D1Database } from '@cloudflare/workers-types';

export type GenerationStage = 'dsl' | 'grid' | 'optimize' | 'score' | 'assets' | 'upload' | 'db';
export type GenerationStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface GenerationJob {
  id: number;
  pattern_id: string;
  stage: GenerationStage;
  status: GenerationStatus;
  error?: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface JobProgress {
  stage: GenerationStage;
  status: GenerationStatus;
  metadata?: Record<string, unknown>;
  error?: string;
}

export class GenerationQueue {
  constructor(private db: D1Database) {}

  async enqueue(patternIds: string[], stages: GenerationStage[] = ['dsl', 'grid', 'optimize', 'score', 'assets', 'upload', 'db']): Promise<GenerationJob[]> {
    const jobs: GenerationJob[] = [];
    for (const patternId of patternIds) {
      for (const stage of stages) {
        const result = await this.db
          .prepare('INSERT INTO generation_jobs (pattern_id, stage, status, metadata) VALUES (?, ?, ?, ?) RETURNING *')
          .bind(patternId, stage, 'pending', '{}')
          .first<GenerationJob>();
        if (result) jobs.push(result);
      }
    }
    return jobs;
  }

  async claim(batchSize = 10): Promise<GenerationJob[]> {
    const now = new Date().toISOString();
    // Update pending jobs to processing, then select them
    await this.db
      .prepare("UPDATE generation_jobs SET status = 'processing', updated_at = ? WHERE status = 'pending' LIMIT ?")
      .bind(now, batchSize)
      .run();

    const { results } = await this.db
      .prepare("SELECT * FROM generation_jobs WHERE status = 'processing' ORDER BY id LIMIT ?")
      .bind(batchSize)
      .all<GenerationJob>();

    return results || [];
  }

  async progress(jobId: number, progress: JobProgress): Promise<void> {
    const metadata = progress.metadata ? JSON.stringify(progress.metadata) : null;
    await this.db
      .prepare('UPDATE generation_jobs SET stage = ?, status = ?, error = ?, metadata = ?, updated_at = ? WHERE id = ?')
      .bind(progress.stage, progress.status, progress.error || null, metadata, new Date().toISOString(), jobId)
      .run();
  }

  async complete(jobId: number, metadata?: Record<string, unknown>): Promise<void> {
    await this.progress(jobId, { stage: 'db', status: 'done', metadata });
  }

  async fail(jobId: number, error: string, stage?: GenerationStage): Promise<void> {
    await this.progress(jobId, { stage: stage || 'db', status: 'failed', error });
  }

  async getPendingCount(): Promise<number> {
    const result = await this.db
      .prepare("SELECT COUNT(*) as count FROM generation_jobs WHERE status = 'pending'")
      .first<{ count: number }>();
    return result?.count || 0;
  }

  async getStats(): Promise<{ pending: number; processing: number; done: number; failed: number }> {
    const { results } = await this.db
      .prepare("SELECT status, COUNT(*) as count FROM generation_jobs GROUP BY status")
      .all<{ status: GenerationStatus; count: number }>();

    const stats = { pending: 0, processing: 0, done: 0, failed: 0 };
    for (const row of results || []) {
      stats[row.status] = row.count;
    }
    return stats;
  }
}
