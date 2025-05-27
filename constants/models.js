// List of default models
export const defaultModels = [
  {
    model: "openai/gpt-4o-mini",
    icon: "https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg"
  },
  {
    model: "google/gemini-2.5-flash-preview-05-20",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png"
  },
  {
    model: "anthropic/claude-3.5-haiku",
    icon: "https://openrouter.ai/images/icons/Anthropic.svg"
  },
  {
    model: "x-ai/grok-3-mini-beta",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s"
  },
  {
    model: "meta-llama/llama-3.3-70b-instruct",
    icon: "https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp"
  },
  {
    model: "deepseek/deepseek-chat-v3-0324",
    icon: "https://logosandtypes.com/wp-content/uploads/2025/02/Deepseek.png"
  }
];

// List of extra models (require OpenRouter token)
export const extraModels = [
  {
    model: "anthropic/claude-sonnet-4",
    icon: "https://openrouter.ai/images/icons/Anthropic.svg",
    requiresToken: true
  },
  {
    model: "google/gemini-2.5-pro-preview",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png",
    requiresToken: true
  },
  {
    model: "openai/chatgpt-4o-latest",
    icon: "https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg",
    requiresToken: true
  },
  {
    model: "perplexity/r1-1776",
    icon: "https://logosandtypes.com/wp-content/uploads/2025/02/Deepseek.png",
    requiresToken: true
  },
  {
    model: "x-ai/grok-3-beta",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s",
    requiresToken: true
  }
];

// Map of model name to icon for quick lookup
export const modelIconsMap = Object.fromEntries([
  ...defaultModels,
  ...extraModels
].map(m => [m.model, m.icon])); 