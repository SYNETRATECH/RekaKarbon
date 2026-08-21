import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return app health', () => {
      const result = appController.getHealth();
      expect(result).toMatchObject({
        status: 'ok',
        service: 'RekaKarbon API',
        version: '1.0.0',
        docs: '/api',
      });
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
