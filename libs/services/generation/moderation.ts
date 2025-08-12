// libs/services/generation/moderation.ts

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

// Basic content moderation patterns - lightweight for MVP
const BLOCKED_PATTERNS = [
  // Explicit content
  /\b(nude|naked|sex|porn|explicit)\b/i,
  
  // Hate speech indicators
  /\b(hate|racist|nazi|terrorist)\b/i,
  
  // Violence
  /\b(violence|blood|weapon|gun|knife|kill|murder)\b/i,
  
  // Illegal activities
  /\b(drug|cocaine|heroin|illegal|bomb|explosive)\b/i,
  
  // Personal information
  /\b(\d{3}-\d{2}-\d{4}|\d{4}\s?\d{4}\s?\d{4}\s?\d{4})\b/i, // SSN, credit card patterns
];

const GENERIC_REJECTION_MESSAGE = "Content does not meet our community guidelines. Please revise your prompt and try again.";

export function moderateContent(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { allowed: true };
  }

  // Basic length check
  if (text.length > 2000) {
    return { 
      allowed: false, 
      reason: "Prompt is too long. Please keep it under 2000 characters." 
    };
  }

  // Check against blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { 
        allowed: false, 
        reason: GENERIC_REJECTION_MESSAGE 
      };
    }
  }

  // Check for excessive repetition (spam indicator)
  if (hasExcessiveRepetition(text)) {
    return { 
      allowed: false, 
      reason: GENERIC_REJECTION_MESSAGE 
    };
  }

  return { allowed: true };
}

function hasExcessiveRepetition(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  const wordCounts: Record<string, number> = {};
  
  // Count word frequencies
  for (const word of words) {
    if (word.length > 2) { // Only count meaningful words
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }
  
  // Check if any word appears more than 30% of the time
  const totalWords = words.filter(w => w.length > 2).length;
  for (const count of Object.values(wordCounts)) {
    if (count / totalWords > 0.3 && count > 5) {
      return true;
    }
  }
  
  return false;
}

export function moderateImageInputs(mode: string, input1?: string, input2?: string): ModerationResult {
  // Basic validation for required inputs per mode
  switch (mode) {
    case 'redesign':
    case 'staging':
      if (!input1) {
        return { 
          allowed: false, 
          reason: `${mode} mode requires an input image` 
        };
      }
      break;
      
    case 'compose':
      if (!input1 || !input2) {
        return { 
          allowed: false, 
          reason: 'Compose mode requires two input images: base room and reference' 
        };
      }
      break;
      
    case 'imagine':
      // No images required for imagine mode
      break;
      
    default:
      return { 
        allowed: false, 
        reason: 'Invalid generation mode' 
      };
  }

  return { allowed: true };
}