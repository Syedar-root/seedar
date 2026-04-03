import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './services/ai.service';
import { ChatService } from './services/chat.service';
import { CreateAiRequest } from './dto/create-ai.request';
import { UpdateAiRequest } from './dto/update-ai.request';
import { AiResponse } from './dto/ai.response';
import { AiChatRequestDto, AiChatResponseDto } from './dto';
import { PaginatedResult } from './ai.types';

@Controller('v1/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAiDto: CreateAiRequest): Promise<AiResponse> {
    return this.aiService.create(createAiDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<PaginatedResult<AiResponse>> {
    return this.aiService.findAll(page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AiResponse> {
    return this.aiService.findOne(id);
  }

  @Patch()
  update(@Body() updateAiDto: UpdateAiRequest): Promise<AiResponse> {
    return this.aiService.update(updateAiDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.aiService.remove(id);
  }

  @Post(':id/chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Param('id') aiId: string,
    @Body() dto: AiChatRequestDto,
  ): Promise<AiChatResponseDto> {
    return this.chatService.chat(aiId, dto.message, dto.stream);
  }
}
