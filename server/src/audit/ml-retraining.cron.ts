import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MlRetrainingService } from './ml-retraining.service';

@Injectable()
export class MlRetrainingCron {
  private readonly logger = new Logger(MlRetrainingCron.name);

  constructor(private readonly mlRetrainingService: MlRetrainingService) {}

  /**
   * Daily cron job scheduled at 02:00 AM (server local time / UTC+7 WIB).
   * Checks verified report accumulation, evaluates data drift via PSI,
   * and conditionally executes retraining if drift is detected or schedule is due.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'ml-daily-retraining-check',
    timeZone: 'Asia/Jakarta',
  })
  public async handleDailyRetrainingCheck(): Promise<void> {
    this.logger.log(
      'Starting daily scheduled ML drift and retraining evaluation...',
    );

    try {
      const result = await this.mlRetrainingService.triggerRetraining({
        force: false,
        dryRun: false,
      });

      if (result.triggered) {
        this.logger.log(
          `Daily retraining executed successfully: ModelSwapped=${result.modelSwapped} (${result.durationMs}ms)`,
        );
      } else {
        this.logger.log(
          'Daily retraining evaluation: conditions not met (no significant drift, schedule not due).',
        );
      }
    } catch (err) {
      this.logger.error(
        `Scheduled daily retraining evaluation failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
