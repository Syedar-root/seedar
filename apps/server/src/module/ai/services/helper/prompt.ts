import fs from 'fs/promises';
import path from 'path';

const loadSkill = async (skillName: string) => {
  const promptPath = path.join(__dirname, `../skills/${skillName}/SKILL.md`);
  return await fs.readFile(promptPath, 'utf8');
};

const loadPrompt = async (promptName: string, mode?: string) => {
  const candidatePaths = mode
    ? [
        path.join(__dirname, `../prompts/${promptName}.${mode}.md`),
        path.join(__dirname, `../prompts/${promptName}.md`),
      ]
    : [path.join(__dirname, `../prompts/${promptName}.md`)];

  for (const promptPath of candidatePaths) {
    try {
      return await fs.readFile(promptPath, 'utf8');
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  throw new Error(
    `Prompt not found: ${promptName}${mode ? ` (mode: ${mode})` : ''}`,
  );
};

export { loadSkill, loadPrompt };
