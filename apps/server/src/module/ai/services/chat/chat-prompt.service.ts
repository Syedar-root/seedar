import { Injectable } from '@nestjs/common';
import { loadPrompt } from '../helper';

@Injectable()
export class ChatPromptService {
  /**
   * Load prompt template used by the act node.
   */
  loadActPrompt(mode?: string): Promise<string> {
    return loadPrompt('act', mode);
  }

  /**
   * Load prompt template used for field-business-name generation.
   */
  loadFieldBusinessNamePrompt(): Promise<string> {
    return loadPrompt('field-business-name');
  }

  /**
   * Load prompt template used for session-title generation.
   */
  loadSessionTitlePrompt(): Promise<string> {
    return loadPrompt('session-title');
  }
}

