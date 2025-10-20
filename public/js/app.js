/**
 * 코칭피드백 AI 시스템 메인 애플리케이션 - Apple Style
 */

// 전역 변수
let currentSessionId = null;
let conversationHistory = [];

// API 기본 설정
const API_BASE_URL = '/api';

// Apple-style 애니메이션 함수들
const addAppleAnimation = (element, animationType = 'fade-in', delay = 0) => {
    if (element) {
        element.style.animationDelay = `${delay}s`;
        element.classList.add(`apple-${animationType}`);
    }
};

const addAppleHoverEffect = (element) => {
    if (element) {
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateY(-2px)';
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translateY(0)';
        });
    }
};

// Apple-style 로딩 애니메이션
const showAppleLoading = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-12">
                <div class="apple-loading w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full"></div>
                <span class="ml-4 apple-text">처리 중...</span>
            </div>
        `;
    }
};

// Apple-style 에러 메시지
const showAppleError = (elementId, message) => {
    const element = document.getElementById(elementId);
    if (element) {
        // 결과 섹션 표시
        element.classList.remove('hidden');
        
        element.innerHTML = `
            <div class="p-6 rounded-lg border-l-4" style="background: rgba(239, 68, 68, 0.1); border-color: #ef4444;">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle mr-3" style="color: #ef4444;"></i>
                    <span class="apple-text-sm" style="color: #ef4444;">${message}</span>
                </div>
            </div>
        `;
    }
};

// Apple-style 성공 메시지
const showAppleSuccess = (elementId, message) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="p-6 rounded-lg border-l-4" style="background: rgba(34, 197, 94, 0.1); border-color: #22c55e;">
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-3" style="color: #22c55e;"></i>
                    <span class="apple-text-sm" style="color: #22c55e;">${message}</span>
                </div>
            </div>
        `;
    }
};

// 함수 별칭 (기존 코드와의 호환성을 위해)
const showLoading = showAppleLoading;
const showError = showAppleError;

// Apple-style 모달 관련 함수들
const openAppleModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // 애니메이션 효과 추가
        setTimeout(() => {
            const modalContent = modal.querySelector('.apple-modal-content');
            if (modalContent) {
                modalContent.classList.add('apple-scale-in');
            }
        }, 10);
    }
};

const closeAppleModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        const modalContent = modal.querySelector('.apple-modal-content');
        if (modalContent) {
            modalContent.classList.remove('apple-scale-in');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            
            // 폼 초기화
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
            
            // 결과 영역 숨기기
            const resultDiv = document.getElementById(modalId.replace('Modal', 'Result'));
            if (resultDiv) {
                resultDiv.classList.add('hidden');
            }
        }, 200);
    }
};

// Apple-style Meeting Prep 관련 함수들 (페이지 이동으로 변경됨)

// 모달 제어 함수들
const showAIAnalysisModal = () => {
    const modal = document.getElementById('aiAnalysisModal');
    if (modal) {
        modal.classList.add('show');
    }
};

const hideAIAnalysisModal = () => {
    const modal = document.getElementById('aiAnalysisModal');
    if (modal) {
        modal.classList.remove('show');
    }
};

// Meeting Prep 폼 데이터 저장 및 복원
const saveMeetingPrepFormData = () => {
    const formData = {
        memberName: document.getElementById('memberName')?.value || '',
        memberPosition: document.getElementById('memberPosition')?.value || '',
        workStyle: document.getElementById('workStyle')?.value || '',
        meetingDateTime: document.getElementById('meetingDateTime')?.value || '',
        recentProjects: document.getElementById('recentProjects')?.value || '',
        tendencies: [],
        leaderIntention: ''
    };
    
    // 체크박스 상태 저장
    const tendencyCheckboxes = [
        document.getElementById('tendencyCommunication'),
        document.getElementById('tendencyPerformance'),
        document.getElementById('tendencyCollaboration'),
        document.getElementById('tendencyLearning')
    ];
    
    tendencyCheckboxes.forEach(checkbox => {
        if (checkbox && checkbox.checked) {
            formData.tendencies.push(checkbox.value);
        }
    });
    
    // 라디오 버튼 상태 저장
    const leaderIntentionRadios = document.querySelectorAll('input[name="leaderIntention"]');
    leaderIntentionRadios.forEach(radio => {
        if (radio && radio.checked) {
            formData.leaderIntention = radio.value;
        }
    });
    
    localStorage.setItem('meetingPrepFormData', JSON.stringify(formData));
};

const loadMeetingPrepFormData = () => {
    try {
        const savedData = localStorage.getItem('meetingPrepFormData');
        if (!savedData) return;
        
        const formData = JSON.parse(savedData);
        
        // 기본 필드 복원
        if (formData.memberName) document.getElementById('memberName').value = formData.memberName;
        if (formData.memberPosition) document.getElementById('memberPosition').value = formData.memberPosition;
        if (formData.workStyle) document.getElementById('workStyle').value = formData.workStyle;
        if (formData.meetingDateTime) document.getElementById('meetingDateTime').value = formData.meetingDateTime;
        if (formData.recentProjects) document.getElementById('recentProjects').value = formData.recentProjects;
        
        // 체크박스 상태 복원
        const tendencyCheckboxes = [
            { id: 'tendencyCommunication', value: '의사소통형' },
            { id: 'tendencyPerformance', value: '성과지향형' },
            { id: 'tendencyCollaboration', value: '협업지향형' },
            { id: 'tendencyLearning', value: '학습지향형' }
        ];
        
        tendencyCheckboxes.forEach(({ id, value }) => {
            const checkbox = document.getElementById(id);
            if (checkbox && formData.tendencies.includes(value)) {
                checkbox.checked = true;
            }
        });
        
        // 라디오 버튼 상태 복원
        if (formData.leaderIntention) {
            const radio = document.querySelector(`input[name="leaderIntention"][value="${formData.leaderIntention}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
        
    } catch (error) {
        console.error('폼 데이터 로드 오류:', error);
    }
};

const clearMeetingPrepFormData = () => {
    localStorage.removeItem('meetingPrepFormData');
};

const handleMeetingPrepSubmit = async (e) => {
    e.preventDefault();
    
    // 팀원 성향 분석 태그 수집
    const selectedTendencies = [];
    const tendencyCheckboxes = [
        document.getElementById('tendencyCommunication'),
        document.getElementById('tendencyPerformance'),
        document.getElementById('tendencyCollaboration'),
        document.getElementById('tendencyLearning')
    ];
    
    tendencyCheckboxes.forEach(checkbox => {
        if (checkbox && checkbox.checked) {
            selectedTendencies.push(checkbox.value);
        }
    });
    
    // 리더 의도 수집
    const leaderIntentionRadios = document.querySelectorAll('input[name="leaderIntention"]');
    let selectedLeaderIntention = '';
    leaderIntentionRadios.forEach(radio => {
        if (radio.checked) {
            selectedLeaderIntention = radio.value;
        }
    });
    
    const formData = {
        teamMember: {
            name: document.getElementById('memberName').value,
            position: document.getElementById('memberPosition').value,
            workStyle: document.getElementById('workStyle').value,
            tendencies: selectedTendencies,
            recentProjects: document.getElementById('recentProjects').value
        },
        meetingInfo: {
            leaderIntention: selectedLeaderIntention,
            meetingDateTime: document.getElementById('meetingDateTime').value
        }
    };

    try {
        // 로딩 모달 표시
        showLoadingModal();
        
        // 결과 섹션 숨기기
        document.getElementById('meetingPrepResult').classList.add('hidden');

        const response = await fetch(`${API_BASE_URL}/meeting-prep/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        // 로딩 모달 숨기기
        hideLoadingModal();

        if (result.success) {
            // 성공 시 폼 데이터 삭제
            clearMeetingPrepFormData();
            displayAppleMeetingPrepResult(result.data);
        } else {
            showAppleError('meetingPrepResult', result.error || 'Meeting Prep 생성에 실패했습니다.');
        }
    } catch (error) {
        console.error('Meeting Prep 생성 오류:', error);
        // 로딩 모달 숨기기
        hideLoadingModal();
        showAppleError('meetingPrepResult', '네트워크 오류가 발생했습니다.');
    }
};

const displayAppleMeetingPrepResult = (data) => {
    const resultDiv = document.getElementById('meetingPrepResult');
    
    // 결과 섹션 표시
    resultDiv.classList.remove('hidden');
    
    resultDiv.innerHTML = `
        <div class="apple-card p-8 apple-fade-in">
            <div class="flex items-center mb-6">
                <div class="apple-icon mr-4" style="background: transparent; color: var(--magenta); font-size: 1.2em;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div>
                    <h4 class="apple-subtitle mb-1">${data.teamMember.name}님의 Meeting Prep</h4>
                    <p class="apple-text-sm">성공적으로 생성되었습니다</p>
                </div>
            </div>
            
            <div class="space-y-8">
                <!-- 프로필 분석 -->
                <div class="apple-card p-6">
                    <h5 class="font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-chart-pie mr-2" style="color: var(--magenta);"></i>
                        프로필 분석
                    </h5>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">강점</p>
                            <ul class="space-y-2">
                                ${data.profileAnalysis.strengths.map(strength => `
                                    <li class="flex items-start">
                                        <i class="fas fa-check-circle mr-2 mt-1" style="color: #22c55e; font-size: 0.75rem;"></i>
                                        <span class="apple-text-sm">${strength}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">개선 영역</p>
                            <ul class="space-y-2">
                                ${data.profileAnalysis.developmentAreas.map(area => `
                                    <li class="flex items-start">
                                        <i class="fas fa-arrow-up mr-2 mt-1" style="color: var(--magenta); font-size: 0.75rem;"></i>
                                        <span class="apple-text-sm">${area}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 코칭 질문 -->
                <div class="apple-card p-6">
                    <h5 class="font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-question-circle mr-2" style="color: var(--purple);"></i>
                        코칭 질문
                    </h5>
                    <div class="space-y-6">
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">상황 파악 질문</p>
                            <ul class="space-y-2">
                                ${data.coachingQuestions.situationAwareness.map(q => `
                                    <li class="flex items-start">
                                        <i class="fas fa-circle mr-2 mt-2" style="color: var(--purple); font-size: 0.5rem;"></i>
                                        <span class="apple-text-sm">${q}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">성장 지원 질문</p>
                            <ul class="space-y-2">
                                ${data.coachingQuestions.growthSupport.map(q => `
                                    <li class="flex items-start">
                                        <i class="fas fa-circle mr-2 mt-2" style="color: var(--light-blue); font-size: 0.5rem;"></i>
                                        <span class="apple-text-sm">${q}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">동기부여 질문</p>
                            <ul class="space-y-2">
                                ${data.coachingQuestions.motivation.map(q => `
                                    <li class="flex items-start">
                                        <i class="fas fa-circle mr-2 mt-2" style="color: var(--deep-blue); font-size: 0.5rem;"></i>
                                        <span class="apple-text-sm">${q}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 코칭 메세지 -->
                <div class="apple-card p-6">
                    <h5 class="font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-heart mr-2" style="color: var(--magenta);"></i>
                        코칭 메세지
                    </h5>
                    <ul class="space-y-3">
                        ${data.encouragementMessages.messages.map(msg => `
                            <li class="flex items-start">
                                <i class="fas fa-quote-left mr-3 mt-1" style="color: var(--magenta); font-size: 0.75rem;"></i>
                                <span class="apple-text-sm">${msg}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- 미팅 가이드라인 -->
                <div class="apple-card p-6">
                    <h5 class="font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-clipboard-list mr-2" style="color: var(--deep-blue);"></i>
                        미팅 가이드라인
                    </h5>
                    <div class="grid md:grid-cols-3 gap-6">
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">시작</p>
                            <ul class="space-y-2">
                                ${data.meetingGuidelines.opening.map(item => `
                                    <li class="flex items-start">
                                        <i class="fas fa-play mr-2 mt-1" style="color: var(--deep-blue); font-size: 0.75rem;"></i>
                                        <span class="apple-text-sm">${item}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">진행</p>
                            <ul class="space-y-2">
                                ${data.meetingGuidelines.during.map(item => `
                                    <li class="flex items-start">
                                        <i class="fas fa-play mr-2 mt-1" style="color: var(--light-blue); font-size: 0.75rem;"></i>
                                        <span class="apple-text-sm">${item}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-700 mb-3">마무리</p>
                            <ul class="space-y-2">
                                ${data.meetingGuidelines.closing.map(item => `
                                    <li class="flex items-start">
                                        <i class="fas fa-stop mr-2 mt-1" style="color: var(--purple); font-size: 0.75rem;"></i>
                                        <span class="apple-text-sm">${item}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Insight Report 관련 함수들 (페이지 이동으로 변경됨)

// 로딩 모달 제어 함수
const showLoadingModal = () => {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.add('show');
        // 스크롤 방지
        document.body.style.overflow = 'hidden';
    }
};

const hideLoadingModal = () => {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('show');
        // 스크롤 복원
        document.body.style.overflow = '';
    }
};

const handleInsightReportSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Insight Report 폼 제출 시작');
    
    try {
        // 기본 정보 수집
        const memberName = document.getElementById('insightMemberName');
        const analysisPeriod = document.getElementById('analysisPeriod');
        
        console.log('📝 기본 정보 수집:', {
            memberName: memberName ? memberName.value : 'NOT_FOUND',
            analysisPeriod: analysisPeriod ? analysisPeriod.value : 'NOT_FOUND'
        });

        // 분석 대상 데이터 수집
        const feedbackLogFile = document.getElementById('feedbackLogFile');
        const feedbackLogText = document.getElementById('feedbackLogText');
        const emotionSummary = document.getElementById('emotionSummary');
        const kpiAchievement = document.getElementById('kpiAchievement');
        const projectCompletion = document.getElementById('projectCompletion');
        const collaborationSatisfaction = document.getElementById('collaborationSatisfaction');
        const feedbackFrequency = document.getElementById('feedbackFrequency');

        console.log('📊 분석 대상 데이터 수집:', {
            feedbackLogFile: feedbackLogFile ? feedbackLogFile.files.length : 'NOT_FOUND',
            feedbackLogText: feedbackLogText ? feedbackLogText.value : 'NOT_FOUND',
            emotionSummary: emotionSummary ? emotionSummary.value : 'NOT_FOUND',
            kpiAchievement: kpiAchievement ? kpiAchievement.value : 'NOT_FOUND',
            projectCompletion: projectCompletion ? projectCompletion.value : 'NOT_FOUND',
            collaborationSatisfaction: collaborationSatisfaction ? collaborationSatisfaction.value : 'NOT_FOUND',
            feedbackFrequency: feedbackFrequency ? feedbackFrequency.value : 'NOT_FOUND'
        });

        // 리더의 분석 목적 수집
        const insightFocus = document.getElementById('insightFocus');
        const reportPurpose = document.getElementById('reportPurpose');
        const leaderComment = document.getElementById('leaderComment');

        console.log('🎯 리더의 분석 목적 수집:', {
            insightFocus: insightFocus ? insightFocus.value : 'NOT_FOUND',
            reportPurpose: reportPurpose ? reportPurpose.value : 'NOT_FOUND',
            leaderComment: leaderComment ? leaderComment.value : 'NOT_FOUND'
        });

        // 필수 필드 검증
        if (!memberName || !memberName.value.trim()) {
            throw new Error('팀원 이름은 필수입니다.');
        }
        if (!insightFocus || !insightFocus.value) {
            throw new Error('인사이트 초점은 필수입니다.');
        }

        const formData = {
            teamMember: {
                name: memberName.value.trim()
            },
            analysisPeriod: analysisPeriod ? parseInt(analysisPeriod.value) : 30,
            analysisTargetData: {
                feedbackLog: {
                    files: feedbackLogFile ? Array.from(feedbackLogFile.files) : [],
                    text: feedbackLogText ? feedbackLogText.value.trim() : ''
                },
                emotionSummary: emotionSummary ? emotionSummary.value.trim() : '',
                performanceData: {
                    kpiAchievement: kpiAchievement ? kpiAchievement.value.trim() : '',
                    projectCompletion: projectCompletion ? projectCompletion.value.trim() : ''
                },
                collaborationMetrics: {
                    satisfaction: collaborationSatisfaction ? parseInt(collaborationSatisfaction.value) : 3,
                    feedbackFrequency: feedbackFrequency ? parseInt(feedbackFrequency.value) : 3
                }
            },
            leaderAnalysisPurpose: {
                insightFocus: insightFocus.value,
                reportPurpose: reportPurpose ? reportPurpose.value : ''
            },
            additionalMemo: {
                leaderComment: leaderComment ? leaderComment.value.trim() : ''
            }
        };

        console.log('📤 전송할 폼 데이터:', formData);

        console.log('⏳ 로딩 모달 표시 중...');
        showLoadingModal();
        document.getElementById('insightReportResult').classList.remove('hidden');
        console.log('✅ 로딩 모달 표시 완료');

        console.log('🌐 API 요청 시작:', `${API_BASE_URL}/insight-report/generate`);
        console.log('📤 전송할 JSON 데이터:', JSON.stringify(formData, null, 2));
        
        const response = await fetch(`${API_BASE_URL}/insight-report/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 API 응답 받음:', response);
        console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));

        console.log('📡 API 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            // 400 오류의 경우 응답 본문도 확인
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                console.log('❌ 서버 오류 응답:', errorData);
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                console.log('❌ 오류 응답 파싱 실패:', e);
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('📋 API 응답 데이터:', result);

        // 로딩 모달 숨기기
        hideLoadingModal();

        if (result.success) {
            console.log('✅ Insight Report 생성 성공');
            displayInsightReportResult(result.data);
        } else {
            console.error('❌ API 오류:', result.error);
            showError('insightReportResult', result.error || 'Insight Report 생성에 실패했습니다.');
        }
    } catch (error) {
        console.error('💥 Insight Report 생성 오류:', error);
        console.error('오류 스택:', error.stack);
        
        // 오류 발생 시에도 로딩 모달 숨기기
        hideLoadingModal();
        
        let errorMessage = '네트워크 오류가 발생했습니다.';
        if (error.message.includes('필수')) {
            errorMessage = error.message;
        } else if (error.message.includes('HTTP')) {
            errorMessage = `서버 오류: ${error.message}`;
        }
        
        showError('insightReportResult', errorMessage);
    }
};

const displayInsightReportResult = (data) => {
    const resultDiv = document.getElementById('insightReportResult');
    
    resultDiv.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
            <div class="flex items-center mb-4">
                <i class="fas fa-chart-line text-green-600 text-xl mr-2"></i>
                <h4 class="text-lg font-semibold text-green-800">${data.teamMember.name}님의 Insight Report</h4>
            </div>
            
            <div class="space-y-6">
                <!-- 현재 상태 요약 -->
                <div>
                    <h5 class="font-semibold text-gray-800 mb-3">📊 현재 상태 요약</h5>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="bg-white p-4 rounded-lg">
                            <p class="text-sm text-gray-600">전반적 컨디션</p>
                            <p class="text-lg font-semibold text-gray-800">${data.overallCondition}</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg">
                            <p class="text-sm text-gray-600">에너지 레벨</p>
                            <p class="text-lg font-semibold text-gray-800">${data.energyLevel}</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg">
                            <p class="text-sm text-gray-600">분석 기간</p>
                            <p class="text-lg font-semibold text-gray-800">${data.period}</p>
                        </div>
                    </div>
                </div>

                <!-- 감정 트렌드 -->
                <div>
                    <h5 class="font-semibold text-gray-800 mb-3">😊 감정 트렌드</h5>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="bg-white p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-green-600">${data.emotionAnalysis.overall.positive}%</div>
                            <p class="text-sm text-gray-600">긍정</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-gray-600">${data.emotionAnalysis.overall.neutral}%</div>
                            <p class="text-sm text-gray-600">중립</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-red-600">${data.emotionAnalysis.overall.negative}%</div>
                            <p class="text-sm text-gray-600">부정</p>
                        </div>
                    </div>
                </div>

                <!-- 핵심 발견사항 -->
                <div>
                    <h5 class="font-semibold text-gray-800 mb-3">🔍 핵심 발견사항</h5>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <p class="text-sm font-medium text-gray-700 mb-2">강점</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                ${data.strengthsAndImprovements.strengths.map(strength => 
                                    `<li>• ${strength.area}: ${strength.description}</li>`
                                ).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-700 mb-2">개선 기회</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                ${data.strengthsAndImprovements.improvementAreas.map(area => 
                                    `<li>• ${area.area}: ${area.description}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 지원 방안 -->
                <div>
                    <h5 class="font-semibold text-gray-800 mb-3">💡 지원 방안</h5>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <p class="text-sm font-medium text-gray-700 mb-2">즉시 실행</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                ${data.supportRecommendations.immediate.map(item => `<li>• ${item}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-700 mb-2">단기 계획</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                ${data.supportRecommendations.shortTerm.map(item => `<li>• ${item}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-700 mb-2">장기 계획</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                ${data.supportRecommendations.longTerm.map(item => `<li>• ${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Issue Navigator 관련 함수들 (페이지 이동으로 변경됨)

const handleRolePlayingSubmit = async (e) => {
    e.preventDefault();
    
    const coachingGoals = Array.from(document.querySelectorAll('#rolePlayingForm input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    const formData = {
        teamMemberProfile: {
            name: document.getElementById('rpMemberName').value,
            position: document.getElementById('rpMemberPosition').value,
            department: document.getElementById('rpMemberDepartment').value
        },
        scenario: document.getElementById('scenario').value,
        coachingGoals
    };

    try {
        showLoading('rolePlayingResult');
        document.getElementById('rolePlayingResult').classList.remove('hidden');

        const response = await fetch(`${API_BASE_URL}/role-playing/start-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            currentSessionId = result.data.sessionId;
            displayRolePlayingSession(result.data);
        } else {
            showError('rolePlayingResult', result.error || '롤플레잉 세션 시작에 실패했습니다.');
        }
    } catch (error) {
        console.error('롤플레잉 세션 시작 오류:', error);
        showError('rolePlayingResult', '네트워크 오류가 발생했습니다.');
    }
};

const displayRolePlayingSession = (data) => {
    const resultDiv = document.getElementById('rolePlayingResult');
    
    resultDiv.innerHTML = `
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                    <i class="fas fa-users text-purple-600 text-xl mr-2"></i>
                    <h4 class="text-lg font-semibold text-purple-800">${data.session.scenario?.title || '롤플레잉 세션'}</h4>
                </div>
                <button onclick="endRolePlayingSession()" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    <i class="fas fa-stop mr-1"></i>세션 종료
                </button>
            </div>
            
            <div class="space-y-4">
                <!-- 페르소나 정보 -->
                <div class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-2">🎭 페르소나 정보</h5>
                    <p class="text-sm text-gray-600">
                        <strong>성격:</strong> ${data.session.persona?.basicPersonality || '정보 없음'} | 
                        <strong>의사소통:</strong> ${data.session.persona?.communicationStyle?.directness || '정보 없음'}, ${data.session.persona?.communicationStyle?.pace || '정보 없음'} | 
                        <strong>현재 기분:</strong> ${data.session.currentContext?.mood || '중립'}
                    </p>
                </div>

                <!-- 대화 영역 -->
                <div class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-3">💬 대화</h5>
                    <div id="conversationArea" class="space-y-3 max-h-64 overflow-y-auto">
                        <div class="flex justify-start">
                            <div class="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                                <p class="text-sm">${data.initialResponse}</p>
                                <p class="text-xs text-blue-600 mt-1">팀원</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex space-x-2">
                        <input type="text" id="userMessage" placeholder="메시지를 입력하세요..." 
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                               onkeypress="handleKeyPress(event)">
                        <button onclick="sendMessage()" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <!-- 코칭 제안 -->
                <div id="coachingSuggestions" class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-3">💡 코칭 제안</h5>
                    <div class="text-sm text-gray-600">
                        <p>대화를 시작하면 실시간 코칭 제안이 여기에 표시됩니다.</p>
                    </div>
                </div>

                <!-- 세션 메트릭 -->
                <div class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-3">📊 세션 메트릭</h5>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.questionsAsked || 0}</div>
                            <p class="text-xs text-gray-600">질문 수</p>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.empathyScore || 0}/5</div>
                            <p class="text-xs text-gray-600">공감 점수</p>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.clarityScore || 0}/5</div>
                            <p class="text-xs text-gray-600">명확성</p>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.overallScore || 0}/5</div>
                            <p class="text-xs text-gray-600">전체 점수</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const sendMessage = async () => {
    const messageInput = document.getElementById('userMessage');
    const message = messageInput.value.trim();
    
    if (!message || !currentSessionId) return;

    // 사용자 메시지를 대화 영역에 추가
    addMessageToConversation('user', message);
    messageInput.value = '';

    try {
        const response = await fetch(`${API_BASE_URL}/role-playing/conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: currentSessionId,
                userMessage: message
            })
        });

        const result = await response.json();

        if (result.success) {
            // 페르소나 응답을 대화 영역에 추가
            addMessageToConversation('assistant', result.data.personaResponse);
            
            // 코칭 제안 업데이트
            updateCoachingSuggestions(result.data.coachingSuggestions);
            
            // 세션 메트릭 업데이트
            updateSessionMetrics(result.data.sessionMetrics);
        } else {
            console.error('대화 처리 실패:', result.error);
        }
    } catch (error) {
        console.error('대화 처리 오류:', error);
    }
};

const addMessageToConversation = (role, message) => {
    const conversationArea = document.getElementById('conversationArea');
    const messageDiv = document.createElement('div');
    
    if (role === 'user') {
        messageDiv.className = 'flex justify-end';
        messageDiv.innerHTML = `
            <div class="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-xs">
                <p class="text-sm">${message}</p>
                <p class="text-xs text-gray-600 mt-1">리더</p>
            </div>
        `;
    } else {
        messageDiv.className = 'flex justify-start';
        messageDiv.innerHTML = `
            <div class="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                <p class="text-sm">${message}</p>
                <p class="text-xs text-blue-600 mt-1">팀원</p>
            </div>
        `;
    }
    
    conversationArea.appendChild(messageDiv);
    conversationArea.scrollTop = conversationArea.scrollHeight;
};

const updateCoachingSuggestions = (suggestions) => {
    const suggestionsDiv = document.getElementById('coachingSuggestions');
    
    suggestionsDiv.innerHTML = `
        <h5 class="font-semibold text-gray-800 mb-3">💡 코칭 제안</h5>
        <div class="space-y-3">
            <div>
                <p class="text-sm font-medium text-gray-700">즉시 적용 가능한 기법</p>
                <ul class="text-sm text-gray-600 ml-4">
                    ${suggestions.immediateTechniques.map(tech => `<li>• ${tech}</li>`).join('')}
                </ul>
            </div>
            <div>
                <p class="text-sm font-medium text-gray-700">다음 질문 제안</p>
                <ul class="text-sm text-gray-600 ml-4">
                    ${suggestions.nextQuestions.map(q => `<li>• ${q}</li>`).join('')}
                </ul>
            </div>
            <div>
                <p class="text-sm font-medium text-gray-700">주의사항</p>
                <ul class="text-sm text-gray-600 ml-4">
                    ${suggestions.cautions.map(caution => `<li>• ${caution}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
};

const updateSessionMetrics = (metrics) => {
    const metricsDiv = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4.gap-4');
    if (metricsDiv && metrics) {
        metricsDiv.innerHTML = `
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.questionsAsked || 0}</div>
                <p class="text-xs text-gray-600">질문 수</p>
            </div>
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.empathyScore || 0}/5</div>
                <p class="text-xs text-gray-600">공감 점수</p>
            </div>
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.clarityScore || 0}/5</div>
                <p class="text-xs text-gray-600">명확성</p>
            </div>
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.overallScore || 0}/5</div>
                <p class="text-xs text-gray-600">전체 점수</p>
            </div>
        `;
    }
};

const endRolePlayingSession = async () => {
    if (!currentSessionId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/role-playing/end-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: currentSessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('롤플레잉 세션이 종료되었습니다.');
            currentSessionId = null;
            closeModal('rolePlayingModal');
        } else {
            console.error('세션 종료 실패:', result.error);
        }
    } catch (error) {
        console.error('세션 종료 오류:', error);
    }
};


// Apple-style 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    // Apple-style 애니메이션 초기화
    initializeAppleAnimations();
    
    console.log('🍎 Apple-style 코칭피드백 AI 시스템이 로드되었습니다');
});

// Apple-style 애니메이션 초기화
const initializeAppleAnimations = () => {
    // 카드에 호버 효과 추가
    const cards = document.querySelectorAll('.apple-card');
    cards.forEach(card => {
        addAppleHoverEffect(card);
    });
    
    // 아이콘에 애니메이션 추가
    const icons = document.querySelectorAll('.apple-icon');
    icons.forEach(icon => {
        addAppleHoverEffect(icon);
    });
    
    // 버튼에 애니메이션 추가
    const buttons = document.querySelectorAll('.apple-btn');
    buttons.forEach(button => {
        addAppleHoverEffect(button);
    });
};

// 실시간 롤플레잉 관련 변수
let realtimeSessionId = null;
let realtimeWebSocket = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// 롤플레잉 음성대화 관련 변수
let roleplayRecognition = null;
let roleplayMediaRecorder = null;
let roleplayAudioChunks = [];
let roleplayCurrentAudio = null;
let roleplayIsListening = false;
let roleplayIsProcessing = false;
let roleplayIsSpeaking = false;
let roleplayUseWhisperSTT = false;

/**
 * 통신 모드 변경 처리
 */
const handleCommunicationModeChange = (event) => {
    const voiceModeInfo = document.getElementById('voiceModeInfo');
    if (event.target.value === 'voice') {
        voiceModeInfo.classList.remove('hidden');
    } else {
        voiceModeInfo.classList.add('hidden');
    }
};

/**
 * 실시간 롤플레잉 세션 시작
 */
const handleRealtimeRolePlayingSubmit = async (event) => {
    try {
        event.preventDefault();
        
        console.log('🎭 실시간 롤플레잉 폼 제출 시작');
        
        // 단계별 DOM 요소 확인
        console.log('1단계: 기본 필드 확인');
        const rpMemberName = document.getElementById('rpMemberName');
        console.log('rpMemberName:', rpMemberName);
        
        const rpMemberPosition = document.getElementById('rpMemberPosition');
        console.log('rpMemberPosition:', rpMemberPosition);
        
        const rpMemberDepartment = document.getElementById('rpMemberDepartment');
        console.log('rpMemberDepartment:', rpMemberDepartment);
        
        console.log('📋 필수 필드 확인:');
        console.log('- rpMemberName:', rpMemberName ? '존재' : '없음');
        console.log('- rpMemberPosition:', rpMemberPosition ? '존재' : '없음');
        console.log('- rpMemberDepartment:', rpMemberDepartment ? '존재' : '없음');
        
        // 필드가 없으면 오류 표시
        if (!rpMemberName || !rpMemberPosition || !rpMemberDepartment) {
            console.error('❌ 필수 필드가 DOM에 없습니다.');
            showError('rolePlayingResult', '필수 필드를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        console.log('📋 선택 요소 확인:');
        console.log('- scenario 라디오:', document.querySelectorAll('input[name="scenario"]').length);
        console.log('- coachingGoals 체크박스:', document.querySelectorAll('input[name="coachingGoals"]').length);
        console.log('- communicationMode 라디오:', document.querySelectorAll('input[name="communicationMode"]').length);
        
        // 필수 필드 검증 (이미 확인된 요소 사용)
        console.log('📋 필드 값 검증:');
        console.log('- rpMemberName 값:', rpMemberName.value);
        console.log('- rpMemberPosition 값:', rpMemberPosition.value);
        console.log('- rpMemberDepartment 값:', rpMemberDepartment.value);
        
        if (!rpMemberName.value || !rpMemberName.value.trim()) {
            console.error('❌ 팀원 이름이 비어있습니다.');
            showError('rolePlayingResult', '팀원 이름은 필수입니다.');
            return;
        }
        
        if (!rpMemberPosition.value || !rpMemberPosition.value.trim()) {
            console.error('❌ 직급이 비어있습니다.');
            showError('rolePlayingResult', '직급은 필수입니다.');
            return;
        }
        
        if (!rpMemberDepartment.value || !rpMemberDepartment.value.trim()) {
            console.error('❌ 부서가 비어있습니다.');
            showError('rolePlayingResult', '부서는 필수입니다.');
            return;
        }
        
        // 시나리오 선택 검증
        const selectedScenario = document.querySelector('input[name="scenario"]:checked');
        console.log('선택된 시나리오:', selectedScenario?.value);
        if (!selectedScenario) {
            showError('rolePlayingResult', '시나리오를 선택해주세요.');
            return;
        }
        
        // 코칭 목표 선택 검증
        const selectedGoals = document.querySelectorAll('input[name="coachingGoals"]:checked');
        console.log('선택된 코칭 목표:', Array.from(selectedGoals).map(cb => cb.value));
        if (selectedGoals.length === 0) {
            showError('rolePlayingResult', '최소 하나의 코칭 목표를 선택해주세요.');
            return;
        }
        
        // 통신 모드 선택 검증
        const selectedMode = document.querySelector('input[name="communicationMode"]:checked');
        console.log('선택된 통신 모드:', selectedMode?.value);
        if (!selectedMode) {
            showError('rolePlayingResult', '통신 모드를 선택해주세요.');
            return;
        }
        
        console.log('✅ 모든 검증 통과, 폼 데이터 생성 중...');
        
        const formData = {
            teamMemberProfile: {
                name: rpMemberName.value,
                position: rpMemberPosition.value,
                department: rpMemberDepartment.value,
                personality: document.getElementById('rpMemberPersonality')?.value || '',
                workStyle: document.getElementById('rpMemberWorkStyle')?.value || '',
                communicationPreference: document.getElementById('rpMemberCommunication')?.value || '',
                feedbackPreference: document.getElementById('rpMemberFeedback')?.value || '',
                stressResponse: document.getElementById('rpMemberStress')?.value || '',
                motivationFactors: document.getElementById('rpMemberMotivation')?.value || ''
            },
            scenario: selectedScenario.value,
            coachingGoals: Array.from(selectedGoals).map(cb => cb.value),
            communicationMode: selectedMode.value
        };

        console.log('📋 폼 데이터:', formData);
        showLoading('rolePlayingResult');

        try {
            console.log('🚀 API 호출 시작:', `${API_BASE_URL}/realtime-role-playing/start-session`);
            const response = await fetch(`${API_BASE_URL}/realtime-role-playing/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('📡 API 응답 상태:', response.status);
            const result = await response.json();
            console.log('📡 API 응답 데이터:', result);

            if (result.success) {
                realtimeSessionId = result.data.sessionId;
                displayRealtimeRolePlayingSession(result.data);
                
                // 음성 모드인 경우 음성 대화 시작
                if (formData.communicationMode === 'voice') {
                    await startVoiceConversation();
                }
            } else {
                console.error('❌ API 오류:', result.error);
                showError('rolePlayingResult', result.error || '실시간 롤플레잉 세션 시작에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 네트워크 오류:', error);
            showError('rolePlayingResult', '네트워크 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('❌ 전체 함수 오류:', error);
        console.error('오류 스택:', error.stack);
        showError('rolePlayingResult', '예상치 못한 오류가 발생했습니다: ' + error.message);
    }
};

/**
 * 실시간 롤플레잉 세션 표시
 */
const displayRealtimeRolePlayingSession = (data) => {
    const resultDiv = document.getElementById('rolePlayingResult');
    
    resultDiv.innerHTML = `
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                    <i class="fas fa-users text-purple-600 text-xl mr-2"></i>
                    <h4 class="text-lg font-semibold text-purple-800">${data.session.scenario?.title || '실시간 롤플레잉 세션'}</h4>
                    <span class="ml-3 px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                        ${data.communicationMode === 'voice' ? '🎤 음성 모드 (GPT-4o-mini Realtime)' : '💬 텍스트 모드 (GPT-4o-mini)'}
                    </span>
                </div>
                <button onclick="endRealtimeRolePlayingSession()" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    <i class="fas fa-stop mr-1"></i>세션 종료
                </button>
            </div>
            
            <div class="space-y-4">
                <!-- 페르소나 정보 -->
                <div class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-2">🎭 페르소나 정보</h5>
                    <p class="text-sm text-gray-600">
                        <strong>성격:</strong> ${data.session.persona?.basicPersonality || '정보 없음'} | 
                        <strong>의사소통:</strong> ${data.session.persona?.communicationStyle?.directness || '정보 없음'}, ${data.session.persona?.communicationStyle?.pace || '정보 없음'} | 
                        <strong>현재 기분:</strong> ${data.session.currentContext?.mood || '중립'}
                    </p>
                </div>

                <!-- 대화 영역 -->
                <div class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-3">💬 대화</h5>
                    <div id="realtimeConversationArea" class="space-y-3 max-h-64 overflow-y-auto">
                        <div class="flex justify-start">
                            <div class="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                                <p class="text-sm">${data.initialResponse}</p>
                                <p class="text-xs text-blue-600 mt-1">팀원</p>
                            </div>
                        </div>
                    </div>
                    
                    ${data.communicationMode === 'voice' ? `
                        <!-- 음성 대화 컨트롤 -->
                        <div class="mt-4 flex justify-center space-x-4">
                            <button id="startRecording" onclick="startVoiceRecording()" class="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700">
                                <i class="fas fa-microphone mr-2"></i>음성 녹음 시작
                            </button>
                            <button id="stopRecording" onclick="stopVoiceRecording()" class="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 hidden">
                                <i class="fas fa-stop mr-2"></i>녹음 중지
                            </button>
                        </div>
                        <div id="recordingStatus" class="mt-2 text-center text-sm text-gray-600 hidden">
                            <i class="fas fa-circle text-red-500 animate-pulse mr-1"></i>녹음 중... (GPT-4o-mini Realtime 처리 중)
                        </div>
                    ` : `
                        <!-- 텍스트 입력 -->
                        <div class="mt-4 flex space-x-2">
                            <input type="text" id="realtimeUserMessage" placeholder="메시지를 입력하세요..." 
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                   onkeypress="handleRealtimeKeyPress(event)">
                            <button onclick="sendRealtimeMessage()" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    `}
                </div>

                <!-- 코칭 제안 -->
                <div id="realtimeCoachingSuggestions" class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-3">💡 코칭 제안</h5>
                    <div class="text-sm text-gray-600">
                        <p>대화를 시작하면 실시간 코칭 제안이 여기에 표시됩니다.</p>
                    </div>
                </div>

                <!-- 세션 메트릭 -->
                <div class="bg-white p-4 rounded-lg">
                    <h5 class="font-semibold text-gray-800 mb-3">📊 세션 메트릭</h5>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.questionsAsked || 0}</div>
                            <p class="text-xs text-gray-600">질문 수</p>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.empathyScore || 0}/5</div>
                            <p class="text-xs text-gray-600">공감 점수</p>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.clarityScore || 0}/5</div>
                            <p class="text-xs text-gray-600">명확성</p>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-800">${data.session.sessionMetrics?.overallScore || 0}/5</div>
                            <p class="text-xs text-gray-600">전체 점수</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultDiv.classList.remove('hidden');
};

/**
 * 롤플레잉 음성 대화 시작
 */
const startVoiceConversation = async () => {
    try {
        console.log('🎤 롤플레잉 음성 대화 시작');
        
        // 브라우저 감지
        const userAgent = navigator.userAgent.toLowerCase();
        roleplayUseWhisperSTT = userAgent.includes('whale');
        
        console.log('🐋 롤플레잉 브라우저 감지:', {
            isWhale: roleplayUseWhisperSTT,
            useWhisperSTT: roleplayUseWhisperSTT
        });
        
        // 음성 인식 설정
        if (roleplayUseWhisperSTT) {
            await setupRoleplayMediaRecorder();
        } else {
            setupRoleplayWebSpeechAPI();
        }
        
        // 음성 대화 UI 업데이트
        updateRoleplayVoiceUI();
        
        console.log('✅ 롤플레잉 음성 대화 설정 완료');
        
    } catch (error) {
        console.error('❌ 롤플레잉 음성 대화 시작 오류:', error);
        alert('음성 대화를 시작할 수 없습니다: ' + error.message);
    }
};

/**
 * 롤플레잉 Web Speech API 설정
 */
// 롤플레잉 음성 인식 종료 타이머 변수 추가
let roleplaySpeechEndTimer = null;
let roleplayAccumulatedTranscript = '';

const setupRoleplayWebSpeechAPI = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        roleplayRecognition = new SpeechRecognition();
        roleplayRecognition.continuous = true; // continuous 모드로 변경하여 계속 듣기
        roleplayRecognition.interimResults = true;
        roleplayRecognition.lang = 'ko-KR';
        roleplayRecognition.maxAlternatives = 1;
        
        roleplayRecognition.onstart = () => {
            console.log('🎤 롤플레잉 음성 인식 시작');
            roleplayAccumulatedTranscript = ''; // 누적 텍스트 초기화
            setRoleplayListening(true);
        };
        
        roleplayRecognition.onresult = (event) => {
            console.log('📝 롤플레잉 음성 인식 결과:', event);
            
            // 기존 타이머가 있으면 취소
            if (roleplaySpeechEndTimer) {
                clearTimeout(roleplaySpeechEndTimer);
                roleplaySpeechEndTimer = null;
            }
            
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                
                if (result.isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (interimTranscript) {
                showRoleplayTranscript(roleplayAccumulatedTranscript + interimTranscript);
            }
            
            if (finalTranscript) {
                // 누적된 텍스트에 추가
                roleplayAccumulatedTranscript += finalTranscript;
                console.log('📝 롤플레잉 누적된 텍스트:', roleplayAccumulatedTranscript);
                
                // 침묵 감지: 1초 후에도 추가 음성이 없으면 처리
                roleplaySpeechEndTimer = setTimeout(() => {
                    console.log('✅ 롤플레잉 음성 입력 완료 (1초 침묵 감지)');
                    
                    if (roleplayAccumulatedTranscript.trim()) {
                        handleRoleplayUserSpeech(roleplayAccumulatedTranscript.trim());
                        hideRoleplayTranscript();
                        roleplayAccumulatedTranscript = ''; // 초기화
                    }
                    
                    // 음성 인식 중지
                    if (roleplayRecognition) {
                        try {
                            roleplayRecognition.stop();
                        } catch (e) {
                            console.log('Roleplay recognition already stopped');
                        }
                    }
                }, 1000); // 1초 대기
            }
        };
        
        roleplayRecognition.onerror = (event) => {
            console.error('❌ 롤플레잉 음성 인식 오류:', event.error);
            
            // 타이머 초기화
            if (roleplaySpeechEndTimer) {
                clearTimeout(roleplaySpeechEndTimer);
                roleplaySpeechEndTimer = null;
            }
            
            setRoleplayListening(false);
        };
        
        roleplayRecognition.onend = () => {
            console.log('🔇 롤플레잉 음성 인식 종료');
            
            // 타이머 초기화
            if (roleplaySpeechEndTimer) {
                clearTimeout(roleplaySpeechEndTimer);
                roleplaySpeechEndTimer = null;
            }
            
            setRoleplayListening(false);
            
            // 자동 재시작
            if (roleplayIsListening && !roleplayIsProcessing && !roleplayIsSpeaking) {
                setTimeout(() => {
                    startRoleplayListening();
                }, 100);
            }
        };
        
        console.log('✅ 롤플레잉 Web Speech API 설정 완료');
    } else {
        console.warn('⚠️ 롤플레잉 Web Speech API를 지원하지 않는 브라우저입니다');
    }
};

/**
 * 롤플레잉 MediaRecorder 설정 (Whisper STT용)
 */
const setupRoleplayMediaRecorder = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        let mimeType = 'audio/webm;codecs=opus';
        if (MediaRecorder.isTypeSupported('audio/wav')) {
            mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
        }
        
        roleplayMediaRecorder = new MediaRecorder(stream, { mimeType });
        
        roleplayMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                roleplayAudioChunks.push(event.data);
            }
        };
        
        roleplayMediaRecorder.onstop = async () => {
            console.log('🎤 롤플레잉 Whisper STT 녹음 완료');
            const audioBlob = new Blob(roleplayAudioChunks, { type: mimeType });
            roleplayAudioChunks = [];
            
            if (audioBlob.size > 0) {
                await processRoleplayWhisperSTT(audioBlob);
            }
        };
        
        console.log('✅ 롤플레잉 MediaRecorder 설정 완료');
    } catch (error) {
        console.error('❌ 롤플레잉 MediaRecorder 설정 실패:', error);
    }
};

/**
 * 롤플레잉 Whisper STT 처리
 */
const processRoleplayWhisperSTT = async (audioBlob) => {
    try {
        setRoleplayProcessing(true);
        console.log('🎤 롤플레잉 Whisper STT 처리 시작');
        
        const fileExtension = audioBlob.type.includes('wav') ? 'wav' : 'webm';
        const fileName = `roleplay-recording.${fileExtension}`;
        
        const formData = new FormData();
        formData.append('audio', audioBlob, fileName);
        formData.append('modelId', 'openai-whisper');
        formData.append('language', 'ko');
        
        const response = await fetch('/api/voice-chat/stt', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`STT 처리 실패: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ 롤플레잉 Whisper STT 결과:', result);
        
        const transcriptText = result.transcript || result.text || '';
        if (transcriptText && transcriptText.trim()) {
            handleRoleplayUserSpeech(transcriptText.trim());
        }
        
    } catch (error) {
        console.error('❌ 롤플레잉 Whisper STT 오류:', error);
    } finally {
        setRoleplayProcessing(false);
    }
};

/**
 * 롤플레잉 사용자 음성 처리
 */
const handleRoleplayUserSpeech = async (transcript) => {
    if (!transcript.trim()) return;
    
    console.log('🗣️ 롤플레잉 사용자 음성:', transcript);
    
    // 사용자 메시지 추가
    addRealtimeMessageToConversation('user', transcript);
    
    // AI 응답 생성
    setRoleplayProcessing(true);
    await generateRoleplayStreamingResponse(transcript);
};

/**
 * 롤플레잉 실시간 스트리밍 AI 응답 생성
 */
const generateRoleplayStreamingResponse = async (userInput) => {
    try {
        console.log('🤖 롤플레잉 AI 응답 생성 시작');
        
        // 스트리밍 응답을 위한 빈 메시지 추가
        addRealtimeMessageToConversation('assistant', '', true);
        
        const response = await fetch('/api/voice-chat/chat-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userInput,
                conversation: [] // 롤플레잉에서는 대화 히스토리 없이 처리
            }),
        });
        
        if (!response.ok) {
            throw new Error('응답 생성 실패');
        }
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                updateLastRealtimeMessage(fullResponse);
                            }
                        } catch (e) {
                            // JSON 파싱 오류 무시
                        }
                    }
                }
            }
        }
        
        // 스트리밍 완료
        updateLastRealtimeMessage(fullResponse, false);
        setRoleplayProcessing(false);
        
        // TTS 시작
        if (fullResponse.trim()) {
            console.log('🔊 롤플레잉 TTS 시작:', fullResponse.trim());
            await speakRoleplayWithOpenAI(fullResponse.trim());
        }
        
    } catch (error) {
        console.error('❌ 롤플레잉 AI 응답 생성 실패:', error);
        setRoleplayProcessing(false);
        addRealtimeMessageToConversation('assistant', '죄송합니다. 응답 생성 중 오류가 발생했습니다.');
    }
};

/**
 * 롤플레잉 브라우저 TTS 처리
 */
const speakRoleplayWithBrowser = async (text) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔊 롤플레잉 브라우저 TTS 시작');
            setRoleplaySpeaking(true);
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = document.getElementById('roleplayVoiceLanguage')?.value || 'ko-KR';
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            
            utterance.onend = () => {
                console.log('✅ 롤플레잉 브라우저 TTS 재생 완료');
                setRoleplaySpeaking(false);
                
                // TTS 완료 후 자동으로 다시 듣기 시작
                setTimeout(() => {
                    if (!roleplayUseWhisperSTT) {
                        startRoleplayListening();
                    }
                }, 300);
                
                resolve();
            };
            
            utterance.onerror = (error) => {
                console.error('❌ 롤플레잉 브라우저 TTS 오류:', error);
                setRoleplaySpeaking(false);
                reject(error);
            };
            
            window.speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('❌ 롤플레잉 브라우저 TTS 초기화 오류:', error);
            setRoleplaySpeaking(false);
            reject(error);
        }
    });
};

/**
 * 롤플레잉 OpenAI TTS 처리 (실패 시 브라우저 TTS로 폴백)
 */
const speakRoleplayWithOpenAI = async (text) => {
    try {
        console.log('🔊 롤플레잉 OpenAI TTS 요청 시작');
        setRoleplaySpeaking(true);
        
        const response = await fetch('/api/voice-chat/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: 'alloy',
                speed: 1.2
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.warn('⚠️ 롤플레잉 OpenAI TTS 실패, 브라우저 TTS로 전환:', errorData.details || errorData.error);
            
            // 브라우저 TTS로 폴백
            setRoleplaySpeaking(false);
            await speakRoleplayWithBrowser(text);
            return;
        }
        
        const audioBlob = await response.blob();
        console.log('🔊 롤플레잉 OpenAI TTS 오디오 생성 완료');
        
        // 오디오 재생
        const audioUrl = URL.createObjectURL(audioBlob);
        roleplayCurrentAudio = new Audio(audioUrl);
        
        roleplayCurrentAudio.onended = () => {
            console.log('✅ 롤플레잉 TTS 재생 완료');
            setRoleplaySpeaking(false);
            URL.revokeObjectURL(audioUrl);
            roleplayCurrentAudio = null;
            
            // TTS 완료 후 자동으로 다시 듣기 시작
            setTimeout(() => {
                if (!roleplayUseWhisperSTT) {
                    startRoleplayListening();
                }
            }, 300);
        };
        
        roleplayCurrentAudio.onerror = (error) => {
            console.error('❌ 롤플레잉 TTS 재생 오류:', error);
            setRoleplaySpeaking(false);
            URL.revokeObjectURL(audioUrl);
            roleplayCurrentAudio = null;
        };
        
        await roleplayCurrentAudio.play();
        
    } catch (error) {
        console.error('❌ 롤플레잉 OpenAI TTS 오류:', error);
        setRoleplaySpeaking(false);
        
        // 브라우저 TTS로 폴백
        try {
            console.log('🔄 롤플레잉 브라우저 TTS로 폴백 시도');
            await speakRoleplayWithBrowser(text);
        } catch (fallbackError) {
            console.error('❌ 롤플레잉 브라우저 TTS 폴백 실패:', fallbackError);
        }
    }
};

/**
 * 롤플레잉 음성 인식 시작
 */
const startRoleplayListening = async () => {
    if (roleplayUseWhisperSTT) {
        // Whisper STT 사용
        if (roleplayMediaRecorder && roleplayMediaRecorder.state === 'inactive') {
            try {
                roleplayAudioChunks = [];
                roleplayMediaRecorder.start();
                setRoleplayListening(true);
                console.log('🎤 롤플레잉 Whisper STT 녹음 시작');
                
                // 6초 후 자동 중지 (사용자가 천천히 말할 수 있도록 시간 증가)
                setTimeout(() => {
                    if (roleplayMediaRecorder && roleplayMediaRecorder.state === 'recording') {
                        roleplayMediaRecorder.stop();
                        setRoleplayListening(false);
                    }
                }, 6000);
            } catch (error) {
                console.error('❌ 롤플레잉 Whisper STT 시작 실패:', error);
            }
        }
    } else {
        // Web Speech API 사용
        if (roleplayRecognition && !roleplayIsListening) {
            try {
                roleplayRecognition.start();
            } catch (error) {
                console.error('❌ 롤플레잉 음성 인식 시작 실패:', error);
            }
        }
    }
};

/**
 * 롤플레잉 음성 인식 중지
 */
const stopRoleplayListening = () => {
    if (roleplayUseWhisperSTT) {
        if (roleplayMediaRecorder && roleplayMediaRecorder.state === 'recording') {
            roleplayMediaRecorder.stop();
            setRoleplayListening(false);
        }
    } else {
        if (roleplayRecognition && roleplayIsListening) {
            roleplayRecognition.stop();
        }
    }
};

/**
 * 롤플레잉 음성 중지
 */
const stopRoleplaySpeaking = () => {
    if (roleplayCurrentAudio) {
        roleplayCurrentAudio.pause();
        roleplayCurrentAudio.currentTime = 0;
        roleplayCurrentAudio = null;
    }
    setRoleplaySpeaking(false);
};

/**
 * 롤플레잉 상태 업데이트 함수들
 */
const setRoleplayListening = (listening) => {
    roleplayIsListening = listening;
    const startBtn = document.getElementById('startRecording');
    const stopBtn = document.getElementById('stopRecording');
    
    if (startBtn && stopBtn) {
        startBtn.classList.toggle('hidden', listening);
        stopBtn.classList.toggle('hidden', !listening);
    }
};

const setRoleplayProcessing = (processing) => {
    roleplayIsProcessing = processing;
    // 처리 상태 표시 (필요시 UI 업데이트)
};

const setRoleplaySpeaking = (speaking) => {
    roleplayIsSpeaking = speaking;
    // 말하기 상태 표시 (필요시 UI 업데이트)
};

/**
 * 롤플레잉 현재 인식 중인 텍스트 표시
 */
const showRoleplayTranscript = (text) => {
    // 롤플레잉에서 인식 중인 텍스트 표시 (필요시 구현)
};

const hideRoleplayTranscript = () => {
    // 롤플레잉에서 인식 중인 텍스트 숨기기 (필요시 구현)
};

/**
 * 롤플레잉 음성 대화 UI 업데이트
 */
const updateRoleplayVoiceUI = () => {
    // 롤플레잉 음성 대화 UI 업데이트
    console.log('🎤 롤플레잉 음성 대화 UI 업데이트');
};

/**
 * 실시간 WebSocket 설정
 */
const setupRealtimeWebSocket = (config) => {
    // 실제 구현에서는 OpenAI Realtime API WebSocket 연결
    console.log('WebSocket 설정 (GPT-4o-mini Realtime):', config);
    
    // 음성 녹음 권한 요청
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            console.log('음성 녹음 권한 획득');
        })
        .catch(error => {
            console.error('음성 녹음 권한 거부:', error);
            alert('음성 녹음을 위해 마이크 권한이 필요합니다.');
        });
};

/**
 * 롤플레잉 음성 녹음 시작
 */
const startVoiceRecording = () => {
    console.log('🎤 롤플레잉 음성 녹음 시작');
    startRoleplayListening();
};

/**
 * 롤플레잉 음성 녹음 중지
 */
const stopVoiceRecording = () => {
    console.log('🔇 롤플레잉 음성 녹음 중지');
    stopRoleplayListening();
};

/**
 * 실시간 메시지 전송
 */
const sendRealtimeMessage = async (message = null) => {
    const userMessage = message || document.getElementById('realtimeUserMessage').value;
    
    if (!userMessage.trim()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/realtime-role-playing/process-conversation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: realtimeSessionId,
                userMessage: userMessage
            })
        });

        const result = await response.json();

        if (result.success) {
            addRealtimeMessageToConversation('user', userMessage);
            addRealtimeMessageToConversation('assistant', result.data.personaResponse);
            
            // 코칭 제안 업데이트
            updateRealtimeCoachingSuggestions(result.data.coachingSuggestions);
            
            // 세션 메트릭 업데이트
            updateRealtimeSessionMetrics(result.data.sessionMetrics);
            
            // 입력 필드 초기화
            if (!message) {
                document.getElementById('realtimeUserMessage').value = '';
            }
        } else {
            console.error('실시간 대화 처리 실패:', result.error);
        }
    } catch (error) {
        console.error('실시간 대화 처리 오류:', error);
    }
};

/**
 * 실시간 대화에 메시지 추가
 */
const addRealtimeMessageToConversation = (role, message) => {
    const conversationArea = document.getElementById('realtimeConversationArea');
    const messageDiv = document.createElement('div');
    
    if (role === 'user') {
        messageDiv.className = 'flex justify-end';
        messageDiv.innerHTML = `
            <div class="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-xs">
                <p class="text-sm">${message}</p>
                <p class="text-xs text-gray-600 mt-1">리더</p>
            </div>
        `;
    } else {
        messageDiv.className = 'flex justify-start';
        messageDiv.innerHTML = `
            <div class="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg max-w-xs">
                <p class="text-sm">${message}</p>
                <p class="text-xs text-blue-600 mt-1">팀원</p>
            </div>
        `;
    }
    
    conversationArea.appendChild(messageDiv);
    conversationArea.scrollTop = conversationArea.scrollHeight;
};

/**
 * 실시간 코칭 제안 업데이트
 */
const updateRealtimeCoachingSuggestions = (suggestions) => {
    const suggestionsDiv = document.getElementById('realtimeCoachingSuggestions');
    
    suggestionsDiv.innerHTML = `
        <h5 class="font-semibold text-gray-800 mb-3">💡 코칭 제안</h5>
        <div class="space-y-3">
            <div>
                <h6 class="font-medium text-gray-700 mb-2">즉시 적용 가능한 기법</h6>
                <ul class="text-sm text-gray-600 space-y-1">
                    ${suggestions.immediateTechniques.map(technique => `<li>• ${technique}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h6 class="font-medium text-gray-700 mb-2">다음 질문 제안</h6>
                <ul class="text-sm text-gray-600 space-y-1">
                    ${suggestions.nextQuestions.map(question => `<li>• ${question}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h6 class="font-medium text-gray-700 mb-2">주의사항</h6>
                <ul class="text-sm text-gray-600 space-y-1">
                    ${suggestions.cautions.map(caution => `<li>• ${caution}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h6 class="font-medium text-gray-700 mb-2">격려 방법</h6>
                <ul class="text-sm text-gray-600 space-y-1">
                    ${suggestions.encouragementMethods.map(method => `<li>• ${method}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
};

/**
 * 실시간 세션 메트릭 업데이트
 */
const updateRealtimeSessionMetrics = (metrics) => {
    const metricsDiv = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4.gap-4');
    if (metricsDiv && metrics) {
        metricsDiv.innerHTML = `
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.questionsAsked || 0}</div>
                <p class="text-xs text-gray-600">질문 수</p>
            </div>
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.empathyScore || 0}/5</div>
                <p class="text-xs text-gray-600">공감 점수</p>
            </div>
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.clarityScore || 0}/5</div>
                <p class="text-xs text-gray-600">명확성</p>
            </div>
            <div class="text-center">
                <div class="text-lg font-semibold text-gray-800">${metrics.overallScore || 0}/5</div>
                <p class="text-xs text-gray-600">전체 점수</p>
            </div>
        `;
    }
};

/**
 * 실시간 세션 종료
 */
const endRealtimeRolePlayingSession = async () => {
    if (!realtimeSessionId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/realtime-role-playing/end-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId: realtimeSessionId })
        });

        const result = await response.json();

        if (result.success) {
            console.log('실시간 세션 종료 완료:', result.data);
            alert('세션이 종료되었습니다.');
            
            // WebSocket 연결 종료
            if (realtimeWebSocket) {
                realtimeWebSocket.close();
                realtimeWebSocket = null;
            }
            
            // 음성 녹음 중지
            if (isRecording) {
                stopVoiceRecording();
            }
            
            // UI 초기화
            realtimeSessionId = null;
            document.getElementById('rolePlayingResult').classList.add('hidden');
        } else {
            console.error('실시간 세션 종료 실패:', result.error);
        }
    } catch (error) {
        console.error('실시간 세션 종료 오류:', error);
    }
};

/**
 * 실시간 키보드 이벤트 처리
 */
const handleRealtimeKeyPress = (event) => {
    if (event.key === 'Enter') {
        sendRealtimeMessage();
    }
};

// ==================== 음성대화 기능 ====================

// 음성대화 관련 변수
let isListening = false;
let isProcessing = false;
let isSpeaking = false;
let recognition = null;
let currentAudio = null;
let conversation = [];
let useWhisperSTT = false;
let isWhale = false;

/**
 * 음성대화 초기화
 */
const initializeVoiceChat = () => {
    console.log('🎤 음성대화 초기화 시작');
    
    // 브라우저 감지
    detectBrowser();
    
    // Web Speech API 설정
    if (!useWhisperSTT) {
        setupWebSpeechAPI();
    }
    
    // MediaRecorder 설정 (Whisper STT용)
    if (useWhisperSTT) {
        setupMediaRecorder();
    }
    
    console.log('🎤 음성대화 초기화 완료');
};

/**
 * 브라우저 감지
 */
const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    isWhale = userAgent.includes('whale');
    useWhisperSTT = isWhale;
    
    console.log('🐋 브라우저 감지:', {
        userAgent: navigator.userAgent,
        isWhale: isWhale,
        useWhisperSTT: useWhisperSTT,
        webSpeechSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    });
    
    // 브라우저 정보 표시
    const browserInfo = document.getElementById('browserInfo');
    if (isWhale && browserInfo) {
        browserInfo.classList.remove('hidden');
    }
};

/**
 * Web Speech API 설정
 */
// 음성 인식 종료 타이머 변수 추가
let speechEndTimer = null;
let accumulatedTranscript = '';

const setupWebSpeechAPI = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // continuous 모드로 변경하여 계속 듣기
        recognition.interimResults = true;
        
        // voiceLanguage 요소가 존재하는지 확인
        const voiceLanguageElement = document.getElementById('voiceLanguage');
        recognition.lang = voiceLanguageElement ? voiceLanguageElement.value : 'ko-KR';
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            console.log('🎤 음성 인식 시작');
            accumulatedTranscript = ''; // 누적 텍스트 초기화
            if (typeof setIsListening === 'function') {
                setIsListening(true);
            }
        };
        
        recognition.onresult = (event) => {
            console.log('📝 음성 인식 결과:', event);
            
            // 기존 타이머가 있으면 취소
            if (speechEndTimer) {
                clearTimeout(speechEndTimer);
                speechEndTimer = null;
            }
            
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                
                if (result.isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (interimTranscript && typeof showCurrentTranscript === 'function') {
                showCurrentTranscript(accumulatedTranscript + interimTranscript);
            }
            
            if (finalTranscript) {
                // 누적된 텍스트에 추가
                accumulatedTranscript += finalTranscript;
                console.log('📝 누적된 텍스트:', accumulatedTranscript);
                
                // 침묵 감지: 1초 후에도 추가 음성이 없으면 처리
                speechEndTimer = setTimeout(() => {
                    console.log('✅ 음성 입력 완료 (1초 침묵 감지)');
                    
                    if (accumulatedTranscript.trim()) {
                        if (typeof handleUserSpeech === 'function') {
                            handleUserSpeech(accumulatedTranscript.trim());
                        }
                        if (typeof hideCurrentTranscript === 'function') {
                            hideCurrentTranscript();
                        }
                        accumulatedTranscript = ''; // 초기화
                    }
                    
                    // 음성 인식 중지
                    if (recognition) {
                        try {
                            recognition.stop();
                        } catch (e) {
                            console.log('Recognition already stopped');
                        }
                    }
                }, 1000); // 1초 대기
            }
        };
        
        recognition.onerror = (event) => {
            console.error('❌ 음성 인식 오류:', event.error);
            
            // 타이머 초기화
            if (speechEndTimer) {
                clearTimeout(speechEndTimer);
                speechEndTimer = null;
            }
            
            if (typeof setIsListening === 'function') {
                setIsListening(false);
            }
        };
        
        recognition.onend = () => {
            console.log('🔇 음성 인식 종료');
            
            // 타이머 초기화
            if (speechEndTimer) {
                clearTimeout(speechEndTimer);
                speechEndTimer = null;
            }
            
            if (typeof setIsListening === 'function') {
                setIsListening(false);
            }
            
            // 자동 재시작
            if (isListening && !isProcessing && !isSpeaking && typeof startListening === 'function') {
                setTimeout(() => {
                    startListening();
                }, 100);
            }
        };
        
        console.log('✅ Web Speech API 설정 완료');
    } else {
        console.warn('⚠️ Web Speech API를 지원하지 않는 브라우저입니다');
    }
};

/**
 * MediaRecorder 설정 (Whisper STT용)
 */
const setupMediaRecorder = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        let mimeType = 'audio/webm;codecs=opus';
        if (MediaRecorder.isTypeSupported('audio/wav')) {
            mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
        }
        
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log('🎤 Whisper STT 녹음 완료');
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            audioChunks = [];
            
            if (audioBlob.size > 0) {
                await processWhisperSTT(audioBlob);
            }
        };
        
        console.log('✅ MediaRecorder 설정 완료');
    } catch (error) {
        console.error('❌ MediaRecorder 설정 실패:', error);
    }
};

/**
 * Whisper STT 처리
 */
const processWhisperSTT = async (audioBlob) => {
    try {
        setIsProcessing(true);
        console.log('🎤 Whisper STT 처리 시작');
        
        const fileExtension = audioBlob.type.includes('wav') ? 'wav' : 'webm';
        const fileName = `recording.${fileExtension}`;
        
        const formData = new FormData();
        formData.append('audio', audioBlob, fileName);
        formData.append('modelId', 'openai-whisper');
        formData.append('language', document.getElementById('voiceLanguage').value === 'ko-KR' ? 'ko' : 'en');
        
        const response = await fetch('/api/voice-chat/stt', {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`STT 처리 실패: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Whisper STT 결과:', result);
        
        const transcriptText = result.transcript || result.text || '';
        if (transcriptText && transcriptText.trim()) {
            handleUserSpeech(transcriptText.trim());
        }
        
    } catch (error) {
        console.error('❌ Whisper STT 오류:', error);
    } finally {
        setIsProcessing(false);
    }
};

/**
 * 사용자 음성 처리
 */
const handleUserSpeech = async (transcript) => {
    if (!transcript.trim()) return;
    
    console.log('🗣️ 사용자 음성:', transcript);
    
    // 사용자 메시지 추가
    addVoiceMessage('user', transcript);
    
    // AI 응답 생성
    setIsProcessing(true);
    await generateStreamingResponse(transcript);
};

/**
 * 실시간 스트리밍 AI 응답 생성
 */
const generateStreamingResponse = async (userInput) => {
    try {
        console.log('🤖 AI 응답 생성 시작');
        
        // 스트리밍 응답을 위한 빈 메시지 추가
        addVoiceMessage('assistant', '', true);
        
        const response = await fetch('/api/voice-chat/chat-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userInput,
                conversation: conversation.slice(-10)
            }),
        });
        
        if (!response.ok) {
            throw new Error('응답 생성 실패');
        }
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                updateLastVoiceMessage(fullResponse);
                            }
                        } catch (e) {
                            // JSON 파싱 오류 무시
                        }
                    }
                }
            }
        }
        
        // 스트리밍 완료
        updateLastVoiceMessage(fullResponse, false);
        setIsProcessing(false);
        
        // TTS 즉시 시작 (텍스트 표시와 동시에 음성 재생)
        if (fullResponse.trim()) {
            console.log('🔊 TTS 즉시 시작 (스트리밍 완료와 동시)');
            // TTS를 백그라운드에서 실행하여 텍스트와 음성이 동시에 나오도록 함
            speakWithOpenAI(fullResponse.trim()).catch(err => {
                console.error('TTS 재생 실패:', err);
            });
        }
        
    } catch (error) {
        console.error('❌ AI 응답 생성 실패:', error);
        setIsProcessing(false);
        addVoiceMessage('assistant', '죄송합니다. 응답 생성 중 오류가 발생했습니다.');
    }
};

/**
 * 브라우저 내장 TTS 처리 (Web Speech API)
 */
const speakWithBrowser = async (text) => {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔊 브라우저 TTS 시작');
            setIsSpeaking(true);
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = document.getElementById('voiceLanguage')?.value || 'ko-KR';
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            
            utterance.onend = () => {
                console.log('✅ 브라우저 TTS 재생 완료');
                setIsSpeaking(false);
                
                // TTS 완료 후 자동으로 다시 듣기 시작
                setTimeout(() => {
                    startListening();
                }, 300);
                
                resolve();
            };
            
            utterance.onerror = (error) => {
                console.error('❌ 브라우저 TTS 오류:', error);
                setIsSpeaking(false);
                reject(error);
            };
            
            window.speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('❌ 브라우저 TTS 초기화 오류:', error);
            setIsSpeaking(false);
            reject(error);
        }
    });
};

/**
 * OpenAI TTS 처리 (실패 시 브라우저 TTS로 폴백)
 */
const speakWithOpenAI = async (text) => {
    try {
        console.log('🔊 OpenAI TTS 요청 시작');
        setIsSpeaking(true);
        
        const response = await fetch('/api/voice-chat/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: 'onyx', // 남성 한국어 목소리 (깊고 안정적인 톤)
                speed: 1.1
            }),
        });
        
        if (!response.ok) {
            let errorMessage = 'OpenAI TTS 실패';
            try {
                const errorData = await response.json();
                errorMessage = errorData.details || errorData.error;
                
                // 429 에러 (할당량 초과)를 명확히 표시
                if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('429')) {
                    console.warn('⚠️ OpenAI API 할당량 초과 - 브라우저 내장 TTS를 사용합니다');
                    addVoiceMessage('system', '💡 OpenAI TTS 할당량이 초과되어 브라우저 음성으로 전환합니다');
                } else {
                    console.warn('⚠️ OpenAI TTS 실패, 브라우저 TTS로 전환:', errorMessage);
                }
            } catch (e) {
                console.warn('⚠️ OpenAI TTS 실패 (응답 파싱 오류), 브라우저 TTS로 전환');
            }
            
            // 브라우저 TTS로 폴백
            setIsSpeaking(false);
            await speakWithBrowser(text);
            return;
        }
        
        const audioBlob = await response.blob();
        console.log('🔊 OpenAI TTS 오디오 생성 완료');
        
        // 오디오 재생
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);
        
        currentAudio.onended = () => {
            console.log('✅ TTS 재생 완료');
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            
            // TTS 완료 후 자동으로 다시 듣기 시작
            setTimeout(() => {
                startListening();
            }, 300);
        };
        
        currentAudio.onerror = (error) => {
            console.error('❌ TTS 재생 오류:', error);
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
        };
        
        await currentAudio.play();
        
    } catch (error) {
        console.error('❌ OpenAI TTS 오류:', error);
        setIsSpeaking(false);
        
        // 브라우저 TTS로 폴백
        try {
            console.log('🔄 브라우저 TTS로 폴백 시도');
            await speakWithBrowser(text);
        } catch (fallbackError) {
            console.error('❌ 브라우저 TTS 폴백 실패:', fallbackError);
        }
    }
};

/**
 * 음성 인식 시작
 */
const startListening = async () => {
    if (useWhisperSTT) {
        // Whisper STT 사용
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            try {
                audioChunks = [];
                mediaRecorder.start();
                if (typeof setIsListening === 'function') {
                    setIsListening(true);
                }
                console.log('🎤 Whisper STT 녹음 시작');
                
                // 6초 후 자동 중지 (사용자가 천천히 말할 수 있도록 시간 증가)
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        if (typeof setIsListening === 'function') {
                            setIsListening(false);
                        }
                    }
                }, 6000);
            } catch (error) {
                console.error('❌ Whisper STT 시작 실패:', error);
            }
        }
    } else {
        // Web Speech API 사용
        if (recognition && !isListening) {
            try {
                const voiceLanguageElement = document.getElementById('voiceLanguage');
                recognition.lang = voiceLanguageElement ? voiceLanguageElement.value : 'ko-KR';
                recognition.start();
            } catch (error) {
                console.error('❌ 음성 인식 시작 실패:', error);
            }
        }
    }
};

/**
 * 음성 인식 중지
 */
const stopListening = () => {
    if (useWhisperSTT) {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            if (typeof setIsListening === 'function') {
                setIsListening(false);
            }
        }
    } else {
        if (recognition && isListening) {
            recognition.stop();
        }
    }
};

/**
 * 음성대화 토글
 */
const toggleVoiceChat = () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
};

/**
 * 음성 중지
 */
const stopSpeaking = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    setIsSpeaking(false);
};

/**
 * 음성대화 모달 표시
 */
const showVoiceChatSection = () => {
    hideAllSections();
    document.getElementById('voiceChatModal').classList.remove('hidden');
    console.log('🎤 음성대화 모달 표시');
};

/**
 * 모든 섹션 숨기기
 */
const hideAllSections = () => {
    const sections = ['meetingPrepModal', 'insightReportModal', 'rolePlayingModal', 'voiceChatModal'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
        }
    });
};

/**
 * 메인 페이지 표시
 */
const showMainPage = () => {
    hideAllSections();
    console.log('🏠 메인 페이지 표시');
};

/**
 * Meeting Prep 섹션 표시
 */
const showMeetingPrepSection = () => {
    hideAllSections();
    document.getElementById('meetingPrepModal').classList.remove('hidden');
    console.log('📋 Meeting Prep 섹션 표시');
};

/**
 * Insight Report 섹션 표시
 */
const showInsightReportSection = () => {
    hideAllSections();
    document.getElementById('insightReportModal').classList.remove('hidden');
    console.log('📊 Insight Report 섹션 표시');
};

/**
 * 롤플레잉 섹션 표시
 */
const showRolePlayingSection = () => {
    hideAllSections();
    document.getElementById('rolePlayingModal').classList.remove('hidden');
    console.log('🎭 롤플레잉 섹션 표시');
};

/**
 * 상태 업데이트 함수들
 */
const setIsListening = (listening) => {
    isListening = listening;
    const status = document.getElementById('listeningStatus');
    const btn = document.getElementById('voiceToggleBtn');
    
    if (status) {
        status.className = `flex items-center space-x-2 ${listening ? 'text-green-600' : 'text-gray-400'}`;
        status.querySelector('span').textContent = listening ? '듣고 있음' : '대기 중';
    }
    
    if (btn) {
        btn.innerHTML = listening ? 
            '<i class="fas fa-microphone-slash"></i><span>듣기 중지</span>' :
            '<i class="fas fa-microphone"></i><span>대화 시작</span>';
        btn.className = `flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            listening ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
        }`;
    }
};

const setIsProcessing = (processing) => {
    isProcessing = processing;
    const status = document.getElementById('processingStatus');
    
    if (status) {
        status.className = `flex items-center space-x-2 ${processing ? 'text-blue-600' : 'text-gray-400'}`;
        status.querySelector('span').textContent = processing ? 'AI 생각 중' : '대기 중';
        
        const dot = status.querySelector('div');
        if (dot) {
            dot.className = `w-3 h-3 rounded-full ${processing ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`;
        }
    }
};

const setIsSpeaking = (speaking) => {
    isSpeaking = speaking;
    const status = document.getElementById('speakingStatus');
    const stopBtn = document.getElementById('voiceStopBtn');
    
    if (status) {
        status.className = `flex items-center space-x-2 ${speaking ? 'text-purple-600' : 'text-gray-400'}`;
        status.querySelector('span').textContent = speaking ? '말하는 중' : '대기 중';
    }
    
    if (stopBtn) {
        stopBtn.classList.toggle('hidden', !speaking);
    }
};

/**
 * 현재 인식 중인 텍스트 표시
 */
const showCurrentTranscript = (text) => {
    const container = document.getElementById('currentTranscript');
    const textSpan = document.getElementById('transcriptText');
    
    if (container && textSpan) {
        textSpan.textContent = text;
        container.classList.remove('hidden');
    }
};

const hideCurrentTranscript = () => {
    const container = document.getElementById('currentTranscript');
    if (container) {
        container.classList.add('hidden');
    }
};

/**
 * 음성대화 메시지 추가
 */
const addVoiceMessage = (role, content, isStreaming = false) => {
    const message = {
        role: role,
        content: content,
        timestamp: new Date(),
        isStreaming: isStreaming
    };
    
    conversation.push(message);
    updateVoiceConversation();
};

/**
 * 마지막 메시지 업데이트
 */
const updateLastVoiceMessage = (content, isStreaming = true) => {
    if (conversation.length > 0) {
        const lastMessage = conversation[conversation.length - 1];
        if (lastMessage.role === 'assistant') {
            lastMessage.content = content;
            lastMessage.isStreaming = isStreaming;
            updateVoiceConversation();
        }
    }
};

/**
 * 음성대화 UI 업데이트
 */
const updateVoiceConversation = () => {
    const container = document.getElementById('voiceConversation');
    if (!container) return;
    
    if (conversation.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">"대화 시작" 버튼을 클릭하고 말해보세요! 🎤</p>';
        return;
    }
    
    const messagesHtml = conversation.map((message, index) => {
        let alignment = 'justify-start';
        let bgClass = 'bg-white text-gray-900 border';
        let timeClass = 'text-gray-500';
        
        if (message.role === 'user') {
            alignment = 'justify-end';
            bgClass = 'bg-blue-500 text-white';
            timeClass = 'text-blue-100';
        } else if (message.role === 'system') {
            alignment = 'justify-center';
            bgClass = 'bg-amber-50 text-amber-800 border border-amber-200';
            timeClass = 'text-amber-600';
        }
        
        return `
        <div class="flex ${alignment} mb-4">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${bgClass}">
                <p class="text-sm">
                    ${message.content}
                    ${message.isStreaming ? '<span class="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>' : ''}
                </p>
                <p class="text-xs mt-1 ${timeClass}">
                    ${message.timestamp.toLocaleTimeString()}
                </p>
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = messagesHtml;
    container.scrollTop = container.scrollHeight;
};

// DOM 로드 완료 후 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 코칭피드백 AI 시스템이 로드되었습니다');
    
    // 카드 클릭 이벤트 (요소와 함수가 존재할 때만)
    const meetingPrepCard = document.getElementById('meetingPrepCard');
    if (meetingPrepCard && typeof showMeetingPrepSection === 'function') {
        meetingPrepCard.addEventListener('click', showMeetingPrepSection);
    }
    
    const insightReportCard = document.getElementById('insightReportCard');
    if (insightReportCard && typeof showInsightReportSection === 'function') {
        insightReportCard.addEventListener('click', showInsightReportSection);
    }
    
    const rolePlayingCard = document.getElementById('rolePlayingCard');
    if (rolePlayingCard && typeof showRolePlayingSection === 'function') {
        rolePlayingCard.addEventListener('click', showRolePlayingSection);
    }
    
    const voiceChatCard = document.getElementById('voiceChatCard');
    if (voiceChatCard && typeof showVoiceChatSection === 'function') {
        voiceChatCard.addEventListener('click', showVoiceChatSection);
    }
    
    // 폼 제출 이벤트 (요소와 함수가 존재할 때만)
    const meetingPrepForm = document.getElementById('meetingPrepForm');
    if (meetingPrepForm && typeof handleMeetingPrepSubmit === 'function') {
        meetingPrepForm.addEventListener('submit', handleMeetingPrepSubmit);
        
        // 폼 데이터 로드
        loadMeetingPrepFormData();
        
        // 실시간 데이터 저장을 위한 이벤트 리스너 추가
        const formFields = [
            'memberName', 'memberPosition', 'workStyle', 'meetingDateTime', 'recentProjects'
        ];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', saveMeetingPrepFormData);
                field.addEventListener('change', saveMeetingPrepFormData);
            }
        });
        
        // 체크박스 이벤트 리스너
        const tendencyCheckboxes = [
            'tendencyCommunication', 'tendencyPerformance', 'tendencyCollaboration', 'tendencyLearning'
        ];
        
        tendencyCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', saveMeetingPrepFormData);
            }
        });
        
        // 라디오 버튼 이벤트 리스너
        const leaderIntentionRadios = document.querySelectorAll('input[name="leaderIntention"]');
        leaderIntentionRadios.forEach(radio => {
            radio.addEventListener('change', saveMeetingPrepFormData);
        });
    }
    
    const insightReportForm = document.getElementById('insightReportForm');
    if (insightReportForm && typeof handleInsightReportSubmit === 'function') {
        console.log('📋 Insight Report 폼 초기화 중...');
        insightReportForm.addEventListener('submit', handleInsightReportSubmit);
        
        // 폼 필드 디버깅
        const formFields = [
            'insightMemberName', 'analysisPeriod', 'feedbackLogFile', 'feedbackLogText',
            'emotionSummary', 'kpiAchievement', 'projectCompletion', 'collaborationSatisfaction',
            'feedbackFrequency', 'insightFocus', 'reportPurpose', 'leaderComment'
        ];
        
        console.log('🔍 폼 필드 존재 여부 확인:');
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            console.log(`  ${fieldId}: ${field ? '✅ 존재' : '❌ 없음'}`);
        });
        
        console.log('✅ Insight Report 폼 초기화 완료');
    } else {
        console.log('⚠️ Insight Report 폼 또는 핸들러를 찾을 수 없음');
    }
    
    const rolePlayingForm = document.getElementById('rolePlayingForm');
    if (rolePlayingForm && typeof handleRealtimeRolePlayingSubmit === 'function') {
        rolePlayingForm.addEventListener('submit', handleRealtimeRolePlayingSubmit);
    }
    
    // 취소 버튼 이벤트 (요소와 함수가 존재할 때만)
    const cancelMeetingPrep = document.getElementById('cancelMeetingPrep');
    if (cancelMeetingPrep && typeof showMainPage === 'function') {
        cancelMeetingPrep.addEventListener('click', showMainPage);
    }
    
    const cancelInsightReport = document.getElementById('cancelInsightReport');
    if (cancelInsightReport && typeof showMainPage === 'function') {
        cancelInsightReport.addEventListener('click', showMainPage);
    }
    
    const cancelRolePlaying = document.getElementById('cancelRolePlaying');
    if (cancelRolePlaying && typeof showMainPage === 'function') {
        cancelRolePlaying.addEventListener('click', showMainPage);
    }
    
    const closeVoiceChat = document.getElementById('closeVoiceChat');
    if (closeVoiceChat && typeof showMainPage === 'function') {
        closeVoiceChat.addEventListener('click', showMainPage);
    }
    
    const closeVoiceChatModal = document.getElementById('closeVoiceChatModal');
    if (closeVoiceChatModal && typeof showMainPage === 'function') {
        closeVoiceChatModal.addEventListener('click', showMainPage);
    }
    
    // 통신 모드 변경 이벤트 (요소와 함수가 존재할 때만)
    const communicationModeRadios = document.querySelectorAll('input[name="communicationMode"]');
    if (communicationModeRadios.length > 0 && typeof handleCommunicationModeChange === 'function') {
        communicationModeRadios.forEach(radio => {
            radio.addEventListener('change', handleCommunicationModeChange);
        });
    }
    
    // 음성대화 이벤트 (요소와 함수가 존재할 때만)
    const voiceToggleBtn = document.getElementById('voiceToggleBtn');
    if (voiceToggleBtn && typeof toggleVoiceChat === 'function') {
        voiceToggleBtn.addEventListener('click', toggleVoiceChat);
    }
    
    const voiceStopBtn = document.getElementById('voiceStopBtn');
    if (voiceStopBtn && typeof stopSpeaking === 'function') {
        voiceStopBtn.addEventListener('click', stopSpeaking);
    }
    
    // 모달 외부 클릭 시 닫기 (요소와 함수가 존재할 때만)
    const voiceChatModal = document.getElementById('voiceChatModal');
    if (voiceChatModal && typeof showMainPage === 'function') {
        voiceChatModal.addEventListener('click', (e) => {
            if (e.target.id === 'voiceChatModal') {
                showMainPage();
            }
        });
    }
    
    // 음성대화 초기화 (함수가 존재할 때만)
    if (typeof initializeVoiceChat === 'function') {
    initializeVoiceChat();
    }
    
    // 조직 현황 폼 초기화 (함수가 존재하고 페이지에 폼이 있을 때만)
    if (typeof initializeTeamStatusForm === 'function' && document.getElementById('teamName')) {
        initializeTeamStatusForm();
    }
});

/**
 * 조직 현황 폼 관련 기능들
 */

// 조직 현황 데이터 저장소
let teamStatusData = null;
let isFormSaved = false;

// 토스트 알림 표시
const showToast = (message, type = 'success') => {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fas fa-check';
    if (type === 'error') {
        iconClass = 'fas fa-exclamation-triangle';
    } else if (type === 'info') {
        iconClass = 'fas fa-info-circle';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // 애니메이션 표시
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
};

// 슬라이더 값 업데이트
const updateSliderValue = (sliderId, valueId) => {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (slider && valueDisplay) {
        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value;
            
            // 애니메이션 효과 추가
            valueDisplay.style.transform = 'scale(1.2)';
            valueDisplay.style.transition = 'all 0.2s ease-in-out';
            
            setTimeout(() => {
                valueDisplay.style.transform = 'scale(1)';
            }, 200);
        });
    }
};

// 문자 수 카운터
const updateCharCounter = (textareaId, counterId, maxLength = 150) => {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    
    if (textarea && counter) {
        textarea.addEventListener('input', () => {
            const currentLength = textarea.value.length;
            counter.textContent = `${currentLength}/${maxLength}`;
            
            if (currentLength > maxLength * 0.9) {
                counter.style.color = '#ef4444';
            } else {
                counter.style.color = '#6b7280';
            }
        });
    }
};

// 폼 데이터 수집
const collectFormData = () => {
    const form = document.getElementById('teamStatusForm');
    if (!form) return null;
    
    const formData = new FormData(form);
    const data = {};
    
    // 기본 필드들
    data.team_name = formData.get('teamName') || '';
    data.team_size = parseInt(formData.get('teamSize')) || 0;
    data.team_role = formData.get('teamRole') || '';
    data.location = formData.get('location') || '';
    
    // 연령대 데이터 처리
    const age20s = parseInt(formData.get('age20s')) || 0;
    const age30s = parseInt(formData.get('age30s')) || 0;
    const age40s = parseInt(formData.get('age40s')) || 0;
    const age50s = parseInt(formData.get('age50s')) || 0;
    
    const ageData = [];
    if (age20s > 0) ageData.push(`20대, ${age20s}명`);
    if (age30s > 0) ageData.push(`30대, ${age30s}명`);
    if (age40s > 0) ageData.push(`40대, ${age40s}명`);
    if (age50s > 0) ageData.push(`50대 이상, ${age50s}명`);
    
    data.team_age = ageData.join(', ');
    
    // 슬라이더 값들
    data.workload_level = parseInt(formData.get('workloadLevel')) || 3;
    data.collaboration_score = parseInt(formData.get('collaborationScore')) || 3;
    data.goal_alignment = parseInt(formData.get('goalAlignment')) || 3;
    data.engagement_level = parseInt(formData.get('engagementLevel')) || 3;
    
    // 라디오 버튼 값들
    data.feedback_frequency = formData.get('feedbackFrequency') || '';
    
    // 체크박스 값들 (복수 선택)
    data.leader_goal = formData.getAll('leaderGoal');
    data.ai_support_expectation = formData.getAll('aiSupportExpectation');
    
    // 텍스트 영역들
    data.team_challenge = formData.get('teamChallenge') || '';
    data.comment = formData.get('comment') || '';
    
    // 타임스탬프 추가
    data.updated_at = new Date().toISOString();
    
    return data;
};

// 폼 데이터 로드
const loadFormData = (data) => {
    if (!data) return;
    
    // 기본 필드들 - null 체크 추가
    const teamNameEl = document.getElementById('teamName');
    const teamSizeEl = document.getElementById('teamSize');
    const teamRoleEl = document.getElementById('teamRole');
    const locationEl = document.getElementById('location');
    
    if (teamNameEl) teamNameEl.value = data.team_name || '';
    if (teamSizeEl) teamSizeEl.value = data.team_size || '';
    if (teamRoleEl) teamRoleEl.value = data.team_role || '';
    if (locationEl) locationEl.value = data.location || '';
    
    // 연령대 데이터 파싱 및 설정
    if (data.team_age) {
        const agePattern = /(\d+대(?: 이상)?), (\d+)명/g;
        let match;
        while ((match = agePattern.exec(data.team_age)) !== null) {
            const ageGroup = match[1];
            const count = parseInt(match[2]);
            
            if (ageGroup.includes('20대')) {
                document.getElementById('age20s').value = count;
            } else if (ageGroup.includes('30대')) {
                document.getElementById('age30s').value = count;
            } else if (ageGroup.includes('40대')) {
                document.getElementById('age40s').value = count;
            } else if (ageGroup.includes('50대')) {
                document.getElementById('age50s').value = count;
            }
        }
    }
    
    // 슬라이더 값들
    document.getElementById('workloadLevel').value = data.workload_level || 3;
    document.getElementById('workloadValue').textContent = data.workload_level || 3;
    document.getElementById('collaborationScore').value = data.collaboration_score || 3;
    document.getElementById('collaborationValue').textContent = data.collaboration_score || 3;
    document.getElementById('goalAlignment').value = data.goal_alignment || 3;
    document.getElementById('goalAlignmentValue').textContent = data.goal_alignment || 3;
    document.getElementById('engagementLevel').value = data.engagement_level || 3;
    document.getElementById('engagementValue').textContent = data.engagement_level || 3;
    
    // 라디오 버튼들
    if (data.feedback_frequency) {
        document.querySelector(`input[name="feedbackFrequency"][value="${data.feedback_frequency}"]`).checked = true;
    }
    
    // 체크박스들
    if (data.leader_goal && Array.isArray(data.leader_goal)) {
        data.leader_goal.forEach(value => {
            const checkbox = document.querySelector(`input[name="leaderGoal"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    if (data.ai_support_expectation && Array.isArray(data.ai_support_expectation)) {
        data.ai_support_expectation.forEach(value => {
            const checkbox = document.querySelector(`input[name="aiSupportExpectation"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // 텍스트 영역들
    document.getElementById('teamChallenge').value = data.team_challenge || '';
    document.getElementById('comment').value = data.comment || '';
    
    // 문자 수 카운터 업데이트
    const commentLength = data.comment ? data.comment.length : 0;
    document.getElementById('commentCount').textContent = `${commentLength}/150`;
};

// 폼 비활성화/활성화
const setFormEnabled = (enabled) => {
    const form = document.getElementById('teamStatusForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = !enabled;
    });
    
    const saveBtn = document.getElementById('saveBtn');
    const editBtn = document.getElementById('editBtn');
    
    if (enabled) {
        saveBtn.style.display = 'flex';
        editBtn.style.display = 'none';
        saveBtn.disabled = false;
    } else {
        saveBtn.style.display = 'none';
        editBtn.style.display = 'flex';
    }
};

// 폼 저장
const saveTeamStatus = async () => {
    const data = collectFormData();
    if (!data) return;
    
    try {
        // 로컬 스토리지에 저장
        localStorage.setItem('teamStatusData', JSON.stringify(data));
        
        // 서버에 저장 (API 호출)
        try {
            const response = await fetch('/api/team-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('서버 저장 성공:', result);
            } else {
                console.warn('서버 저장 실패, 로컬 스토리지만 사용');
            }
        } catch (serverError) {
            console.warn('서버 연결 실패, 로컬 스토리지만 사용:', serverError);
        }
        
        // 로컬 저장 성공 처리
        teamStatusData = data;
        isFormSaved = true;
        setFormEnabled(false);
        showToast('조직 현황이 저장되었습니다.', 'success');
        
    } catch (error) {
        console.error('조직 현황 저장 오류:', error);
        showToast('저장 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
};

// 폼 수정 모드로 전환
const editTeamStatus = () => {
    setFormEnabled(true);
    showToast('수정 모드로 전환되었습니다.', 'info');
};

// 조직 현황 폼 초기화
const initializeTeamStatusForm = () => {
    // 기존 데이터 로드
    const savedData = localStorage.getItem('teamStatusData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            teamStatusData = data;
            loadFormData(data);
            isFormSaved = true;
            setFormEnabled(false);
        } catch (error) {
            console.error('저장된 데이터 로드 오류:', error);
        }
    }
    
    // 슬라이더 이벤트 리스너 등록
    updateSliderValue('workloadLevel', 'workloadValue');
    updateSliderValue('collaborationScore', 'collaborationValue');
    updateSliderValue('goalAlignment', 'goalAlignmentValue');
    updateSliderValue('engagementLevel', 'engagementValue');
    
    // 문자 수 카운터 이벤트 리스너 등록
    updateCharCounter('comment', 'commentCount', 150);
    
    // 버튼 이벤트 리스너 등록
    const saveBtn = document.getElementById('saveBtn');
    const editBtn = document.getElementById('editBtn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveTeamStatus);
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', editTeamStatus);
    }
    
    console.log('조직 현황 폼이 초기화되었습니다.');
};
