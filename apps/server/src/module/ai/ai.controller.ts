import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AiService } from './services/ai.service';
import { CreateAiRequest } from './dto/create-ai.request';
import { UpdateAiRequest } from './dto/update-ai.request';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  create(@Body() createAiDto: CreateAiRequest) {
    return this.aiService.create(createAiDto);
  }

  @Get()
  findAll() {
    return this.aiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiService.findOne(+id);
  }

  @Patch()
  update(@Body() updateAiDto: UpdateAiRequest) {
    return this.aiService.update(updateAiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiService.remove(+id);
  }
}
