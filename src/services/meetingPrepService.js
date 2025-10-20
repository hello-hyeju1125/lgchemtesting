import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import openaiConfig from '../config/openaiConfig.js';

class MeetingPrepService {
  constructor() {
    // 중앙화된 설정 사용
  }

  getOpenAI() {
    if (!this.openai && openaiConfig.isAPIKeyValid()) {
      this.openai = new OpenAI({
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.baseURL
      });
    }
    return this.openai;
  }

  /**
   * 팀원 정보를 기반으로 미팅 프렙팩 생성
   * @param {Object} teamMember - 팀원 정보
   * @returns {Object} 미팅 프렙팩
   */
  async generateMeetingPrep(teamMember) {
    try {
      const { name, position, department, workStyle, recentProjects, feedbackHistory } = teamMember;
      
      // 1. 팀원 프로필 분석
      const profileAnalysis = await this.analyzeProfile(teamMember);
      
      // 2. 코칭 질문 생성
      const coachingQuestions = await this.generateCoachingQuestions(profileAnalysis);
      
      // 3. 코칭 메세지 생성
      const encouragementMessages = await this.generateEncouragementMessages(profileAnalysis, name);
      
      // 4. 미팅 가이드라인 생성
      const meetingGuidelines = await this.generateMeetingGuidelines(profileAnalysis);
      
      // 5. 후속 액션 아이템 생성
      const actionItems = await this.generateActionItems(profileAnalysis);

      return {
        id: uuidv4(),
        teamMember: {
          name,
          position,
          department
        },
        generatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        profileAnalysis,
        coachingQuestions,
        encouragementMessages,
        meetingGuidelines,
        actionItems,
        estimatedDuration: '45-60분'
      };
    } catch (error) {
      console.error('❌ 미팅 프렙팩 생성 중 오류:', error);
      throw new Error('미팅 프렙팩 생성에 실패했습니다');
    }
  }

  /**
   * 팀원 프로필 분석
   */
  async analyzeProfile(teamMember) {
    const prompt = `
다음 팀원 정보를 분석하여 코칭에 필요한 인사이트를 제공해주세요:

팀원 정보:
- 이름: ${teamMember.name}
- 직급: ${teamMember.position}
- 부서: ${teamMember.department}
- 업무 스타일: ${teamMember.workStyle || '정보 없음'}
- 최근 프로젝트: ${teamMember.recentProjects || '정보 없음'}
- 피드백 이력: ${teamMember.feedbackHistory || '정보 없음'}

다음 형식으로 분석 결과를 JSON으로 제공해주세요:
{
  "strengths": ["강점1", "강점2", "강점3"],
  "developmentAreas": ["개선영역1", "개선영역2"],
  "communicationStyle": "의사소통 스타일 분석",
  "motivationFactors": ["동기요인1", "동기요인2"],
  "currentChallenges": ["현재 도전과제1", "현재 도전과제2"],
  "energyLevel": "high|medium|low",
  "recentTrends": "최근 트렌드 분석"
}
`;

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 분석을 사용합니다.');
      return this.getDefaultProfileAnalysis();
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
        ...openaiConfig.getAPIConfig({ temperature: 0.7, max_tokens: 1000 }),
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0].message.content;
      try {
        // JSON 부분만 추출 (첫 번째 { 부터 마지막 } 까지)
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonContent = content.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonContent);
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다');
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.log('원본 응답:', content);
        return this.getDefaultProfileAnalysis();
      }
    } catch (error) {
      console.error('프로필 분석 오류:', error);
      return this.getDefaultProfileAnalysis();
    }
  }

  /**
   * 코칭 질문 생성
   */
  async generateCoachingQuestions(profileAnalysis) {
    const prompt = `
다음 팀원 프로필 분석을 바탕으로 효과적인 코칭 질문을 생성해주세요:

프로필 분석:
${JSON.stringify(profileAnalysis, null, 2)}

다음 카테고리별로 질문을 생성해주세요:
1. 상황 파악 질문 (2개)
2. 성장 지원 질문 (3개)  
3. 동기부여 질문 (2개)

각 질문은 구체적이고 개방적이며, 팀원의 성장을 이끌어낼 수 있어야 합니다.

다음 JSON 형식으로 제공해주세요:
{
  "situationAwareness": ["질문1", "질문2"],
  "growthSupport": ["질문1", "질문2", "질문3"],
  "motivation": ["질문1", "질문2"]
}
`;

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 코칭 질문을 사용합니다.');
      return this.getDefaultCoachingQuestions();
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
        ...openaiConfig.getAPIConfig({ temperature: 0.8, max_tokens: 800 }),
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0].message.content;
      try {
        // JSON 부분만 추출 (첫 번째 { 부터 마지막 } 까지)
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonContent = content.substring(jsonStart, jsonEnd);
          return JSON.parse(jsonContent);
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다');
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.log('원본 응답:', content);
        return this.getDefaultCoachingQuestions();
      }
    } catch (error) {
      console.error('코칭 질문 생성 오류:', error);
      return this.getDefaultCoachingQuestions();
    }
  }

  /**
   * 코칭 메세지 생성
   */
  async generateEncouragementMessages(profileAnalysis, teamMemberName) {
    console.log('🎉 코칭 메세지 생성 시작:', teamMemberName);
    
    const prompt = `
다음 팀원의 강점과 성과를 바탕으로 진정성 있는 코칭 메세지를 생성해주세요:

팀원 이름: ${teamMemberName}
강점: ${profileAnalysis.strengths.join(', ')}
최근 트렌드: ${profileAnalysis.recentTrends}

다음 형식의 코칭 메세지 3개를 생성해주세요:
1. 구체적인 행동과 결과를 언급하는 메시지
2. 팀에 미치는 긍정적 영향에 대한 메시지  
3. 미래 성장 가능성에 대한 메시지

중요: 각 메시지는 반드시 "${teamMemberName}님"으로 시작해야 합니다. 다른 호칭이나 "~~님" 같은 플레이스홀더를 사용하지 마세요.

예시:
"${teamMemberName}님의 최근 프로젝트에서 보여주신 리더십이 정말 인상적이었습니다."

JSON 형식으로 제공해주세요:
{
  "messages": ["메시지1", "메시지2", "메시지3"]
}
`;

    if (!this.getOpenAI()) {
      console.log('OpenAI API 키가 설정되지 않아 기본 코칭 메세지를 사용합니다.');
      return this.getDefaultEncouragementMessages(teamMemberName);
    }

    try {
      const response = await this.getOpenAI().chat.completions.create({
        ...openaiConfig.getAPIConfig({ temperature: 0.9, max_tokens: 600 }),
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.choices[0].message.content;
      try {
        // JSON 부분만 추출 (첫 번째 { 부터 마지막 } 까지)
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonContent = content.substring(jsonStart, jsonEnd);
          const result = JSON.parse(jsonContent);
          console.log('🎉 코칭 메세지 생성 완료:', result.messages);
          return result;
        } else {
          throw new Error('JSON 형식을 찾을 수 없습니다');
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.log('원본 응답:', content);
        return this.getDefaultEncouragementMessages(teamMemberName);
      }
    } catch (error) {
      console.error('코칭 메세지 생성 오류:', error);
      return this.getDefaultEncouragementMessages(teamMemberName);
    }
  }

  /**
   * 미팅 가이드라인 생성
   */
  async generateMeetingGuidelines(profileAnalysis) {
    return {
      opening: [
        "따뜻한 인사와 최근 근황 물어보기",
        "이번 미팅의 목적과 기대효과 공유",
        "편안한 분위기 조성"
      ],
      during: [
        "적극적인 경청과 공감 표현",
        "구체적인 예시를 통한 피드백",
        "성장 지향적 질문 활용",
        "팀원의 의견을 존중하고 격려"
      ],
      closing: [
        "다음 단계와 후속 조치 명확히 하기",
        "지속적인 지원 의지 표현",
        "다음 미팅 일정 조율"
      ]
    };
  }

  /**
   * 액션 아이템 생성
   */
  async generateActionItems(profileAnalysis) {
    return {
      immediate: [
        "개선 영역에 대한 구체적인 학습 계획 수립",
        "강점을 활용할 수 있는 새로운 기회 탐색"
      ],
      shortTerm: [
        "1개월 내 목표 설정 및 진행 상황 체크",
        "필요한 리소스나 지원 요청사항 파악"
      ],
      longTerm: [
        "3-6개월 성장 로드맵 수립",
        "장기적 커리어 목표와의 연계성 검토"
      ]
    };
  }

  // 기본값 제공 메서드들
  getDefaultProfileAnalysis() {
    return {
      strengths: ["협업 능력", "문제 해결 능력", "학습 의지"],
      developmentAreas: ["의사소통", "시간 관리"],
      communicationStyle: "직접적이고 솔직한 스타일",
      motivationFactors: ["성장 기회", "인정과 격려"],
      currentChallenges: ["업무 우선순위 설정", "스트레스 관리"],
      energyLevel: "medium",
      recentTrends: "안정적인 성과 지속"
    };
  }

  getDefaultCoachingQuestions() {
    return {
      situationAwareness: [
        "최근 진행 중인 프로젝트에서 가장 중요하게 생각하는 부분은 무엇인가요?",
        "이번 주 업무에서 가장 큰 성취감을 느낀 순간은 언제였나요?"
      ],
      growthSupport: [
        "현재 역량 개발에서 집중하고 싶은 영역이 있나요?",
        "업무 수행 중 가장 도움이 필요한 부분은 무엇인가요?",
        "6개월 후 어떤 모습이 되고 싶으신가요?"
      ],
      motivation: [
        "팀에서 가치 있다고 느끼는 활동은 무엇인가요?",
        "어떤 상황에서 가장 많은 에너지를 얻나요?"
      ]
    };
  }

  getDefaultEncouragementMessages(teamMemberName = '팀원') {
    return {
      messages: [
        `${teamMemberName}님의 최근 보여주신 성과가 정말 인상적입니다. 특히 팀워크와 문제 해결 능력이 돋보였어요.`,
        `${teamMemberName}님의 꾸준한 노력과 긍정적인 태도가 팀 전체에 좋은 영향을 주고 있습니다.`,
        `${teamMemberName}님은 앞으로도 현재의 성장세를 유지하시면 더욱 큰 성과를 거두실 수 있을 것 같습니다.`
      ]
    };
  }
}

export default new MeetingPrepService();
