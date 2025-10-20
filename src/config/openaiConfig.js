import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

/**
 * OpenAI API 설정 및 모델 구성
 */
class OpenAIConfig {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    // 모델별 기본 설정
    this.modelConfigs = {
      'gpt-4o-mini-realtime': {
        name: 'gpt-4o-mini-realtime',
        maxTokens: 16384,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        description: 'GPT-4o-mini Realtime - 실시간 음성 대화 모델',
        supportsRealtime: true,
        supportsAudio: true
      },
      'gpt-4o-mini': {
        name: 'gpt-4o-mini',
        maxTokens: 16384,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        description: 'GPT-4o-mini - 비용 효율적인 고성능 모델',
        supportsRealtime: false,
        supportsAudio: false
      },
      'gpt-5': {
        name: 'gpt-5',
        maxTokens: 200000,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        description: 'GPT-5 - 최신 고성능 모델 (출시 예정)',
        supportsRealtime: false,
        supportsAudio: false
      },
      'gpt-4o': {
        name: 'gpt-4o',
        maxTokens: 128000,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        description: 'GPT-4o - 멀티모달 고성능 모델',
        supportsRealtime: false,
        supportsAudio: false
      },
      'gpt-4': {
        name: 'gpt-4',
        maxTokens: 8192,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        description: 'GPT-4 - 고성능 텍스트 모델',
        supportsRealtime: false,
        supportsAudio: false
      },
      'gpt-3.5-turbo': {
        name: 'gpt-3.5-turbo',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        description: 'GPT-3.5-turbo - 빠르고 효율적인 모델',
        supportsRealtime: false,
        supportsAudio: false
      }
    };
  }

  /**
   * 현재 설정된 모델의 구성 반환
   */
  getCurrentModelConfig() {
    return this.modelConfigs[this.model] || this.modelConfigs['gpt-4o-mini'];
  }

  /**
   * 특정 모델의 구성 반환
   */
  getModelConfig(modelName) {
    return this.modelConfigs[modelName] || this.modelConfigs['gpt-4o-mini'];
  }

  /**
   * API 호출을 위한 기본 설정 반환
   */
  getAPIConfig(customConfig = {}) {
    const modelConfig = this.getCurrentModelConfig();
    
    return {
      model: modelConfig.name,
      temperature: customConfig.temperature || modelConfig.temperature,
      max_tokens: customConfig.max_tokens || modelConfig.maxTokens,
      top_p: customConfig.top_p || modelConfig.topP,
      frequency_penalty: customConfig.frequency_penalty || modelConfig.frequencyPenalty,
      presence_penalty: customConfig.presence_penalty || modelConfig.presencePenalty,
      ...customConfig
    };
  }

  /**
   * 감정 분석을 위한 최적화된 설정
   */
  getEmotionAnalysisConfig() {
    return this.getAPIConfig({
      temperature: 0.3,
      max_tokens: 500
    });
  }

  /**
   * 스트레스/몰입 분석을 위한 최적화된 설정
   */
  getStressEngagementConfig() {
    return this.getAPIConfig({
      temperature: 0.4,
      max_tokens: 600
    });
  }

  /**
   * 강점/개선영역 분석을 위한 최적화된 설정
   */
  getStrengthsAnalysisConfig() {
    return this.getAPIConfig({
      temperature: 0.5,
      max_tokens: 800
    });
  }

  /**
   * 페르소나 생성을 위한 최적화된 설정
   */
  getPersonaGenerationConfig() {
    return this.getAPIConfig({
      temperature: 0.8,
      max_tokens: 800
    });
  }

  /**
   * 대화 응답 생성을 위한 최적화된 설정
   */
  getConversationConfig() {
    return this.getAPIConfig({
      temperature: 0.9,
      max_tokens: 200
    });
  }

  /**
   * 코칭 제안 생성을 위한 최적화된 설정
   */
  getCoachingSuggestionsConfig() {
    return this.getAPIConfig({
      temperature: 0.7,
      max_tokens: 600
    });
  }

  /**
   * 초기 응답 생성을 위한 최적화된 설정
   */
  getInitialResponseConfig() {
    return this.getAPIConfig({
      temperature: 0.8,
      max_tokens: 150
    });
  }

  /**
   * API 키 유효성 검사
   */
  isAPIKeyValid() {
    return this.apiKey && this.apiKey.length > 0;
  }

  /**
   * 현재 설정 정보 반환
   */
  getConfigInfo() {
    return {
      model: this.model,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined',
      baseURL: this.baseURL,
      currentModelConfig: this.getCurrentModelConfig()
    };
  }
}

export default new OpenAIConfig();
