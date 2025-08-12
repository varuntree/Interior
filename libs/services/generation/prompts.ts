// libs/services/generation/prompts.ts
import type { Mode } from '@/libs/app-config/runtime';

export interface PromptParams {
  mode: Mode;
  roomType?: string;
  style?: string;
  userPrompt?: string;
}

// Shared guardrails for modes that keep existing structure
const STRUCTURAL_GUARDRAILS = [
  "Photoreal interior render, correct perspective, realistic lighting.",
  "Keep existing room architecture: walls, windows, doors, floors, ceiling height and wall positions unchanged.",
  "Do not alter structural layout, view direction, or window positions."
].join(' ');

// Australian context booster
const AU_CONTEXT = [
  "Use materials and furnishings commonly found in Australian homes.",
  "Respect local light quality: bright, airy daylight."
].join(' ');

// Style seeds - expandable from config
const STYLE_DESCRIPTIONS: Record<string, string> = {
  'coastal_au': 'light timbers, white walls, linen textures, pale blues/greens',
  'contemporary_au': 'clean lines, matte finishes, warm neutral palette',
  'japandi': 'minimal, natural woods, soft contrast',
  'scandi_au': 'light oak, white, soft greys, cozy textiles',
  'minimal_au': 'restrained palette, functional layout',
  'midcentury_au': 'teak, low profiles, muted color pops',
  'industrial_au': 'concrete, metal accents, leather',
  'hamptons_au': 'white timber, navy accents, coastal elegance'
};

export function buildPrompt(params: PromptParams): string {
  const { mode, roomType, style, userPrompt } = params;
  
  const parts: string[] = [];
  
  // Mode-specific template
  switch (mode) {
    case 'redesign':
      parts.push(STRUCTURAL_GUARDRAILS);
      parts.push('Keep room structure. Restyle furnishings, decor, color palette and finishes.');
      if (style) parts.push(`Style: ${getStyleDescription(style)}.`);
      if (roomType) parts.push(`Room type: ${roomType}.`);
      parts.push(AU_CONTEXT);
      if (userPrompt) parts.push(userPrompt);
      break;
      
    case 'staging':
      parts.push(STRUCTURAL_GUARDRAILS);
      if (roomType && style) {
        parts.push(`Assume the room may be empty or under-furnished. Add tasteful furniture and decor appropriate for ${getStyleDescription(style)}, for a ${roomType} in an Australian home. Do not move walls/doors/windows.`);
      }
      if (userPrompt) parts.push(userPrompt);
      break;
      
    case 'compose':
      parts.push('Use the first image as the base room; keep its architecture intact.');
      parts.push('Use the second image only as style/reference for palette, materials, or the specified object.');
      parts.push('Harmonize lighting and perspective.');
      if (style) parts.push(`Style: ${getStyleDescription(style)}.`);
      if (roomType) parts.push(`Room type: ${roomType}.`);
      if (userPrompt) parts.push(userPrompt);
      break;
      
    case 'imagine':
      if (!userPrompt) {
        throw new Error('User prompt is required for imagine mode');
      }
      if (roomType && style) {
        parts.push(`Generate a photoreal interior concept for a ${roomType} in ${getStyleDescription(style)} for an Australian home. Balanced composition, realistic materials, natural light.`);
      }
      parts.push(userPrompt);
      break;
      
    default:
      throw new Error(`Unsupported generation mode: ${mode}`);
  }
  
  return parts.filter(part => part && part.trim()).join(' ');
}

function getStyleDescription(styleId: string): string {
  return STYLE_DESCRIPTIONS[styleId] || styleId;
}

export function validatePromptParams(params: PromptParams): { valid: boolean; error?: string } {
  const { mode, userPrompt } = params;
  
  // Imagine mode requires user prompt
  if (mode === 'imagine' && (!userPrompt || userPrompt.trim().length === 0)) {
    return { valid: false, error: 'User prompt is required for imagine mode' };
  }
  
  // Basic length validation
  if (userPrompt && userPrompt.length > 1000) {
    return { valid: false, error: 'User prompt is too long (max 1000 characters)' };
  }
  
  return { valid: true };
}