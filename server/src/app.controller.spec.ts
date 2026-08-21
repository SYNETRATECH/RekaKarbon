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
    it('should return app info', () => {
      const result = appController.getRoot();
      expect(result).toMatchObject({
        service: 'RekaKarbon Core Backend API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health',
      });
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
