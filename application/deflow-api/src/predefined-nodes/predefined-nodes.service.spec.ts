import { Test, TestingModule } from '@nestjs/testing';
import { PredefinedNodesService } from './predefined-nodes.service';

describe('PredefinedNodesService', () => {
  let service: PredefinedNodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PredefinedNodesService],
    }).compile();

    service = module.get<PredefinedNodesService>(PredefinedNodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
