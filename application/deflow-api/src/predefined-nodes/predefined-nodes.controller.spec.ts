import { Test, TestingModule } from '@nestjs/testing';
import { PredefinedNodesController } from './predefined-nodes.controller';
import { PredefinedNodesService } from './predefined-nodes.service';

describe('PredefinedNodesController', () => {
  let controller: PredefinedNodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredefinedNodesController],
      providers: [PredefinedNodesService],
    }).compile();

    controller = module.get<PredefinedNodesController>(PredefinedNodesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
