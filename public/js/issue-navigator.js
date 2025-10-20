// Issue Navigator 전용 스크립트
let issueContext = {}; // 사용자가 입력한 이슈 데이터를 저장
let chatHistory = []; // 대화 기록

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rolePlayingForm');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const endChatBtn = document.getElementById('endChatBtn');
    const confirmModal = document.getElementById('confirmModal');
    const modalYesBtn = document.getElementById('modalYesBtn');
    const modalNoBtn = document.getElementById('modalNoBtn');
    
    // 영향 정도 슬라이더 값 업데이트
    const impactLevel = document.getElementById('impactLevel');
    const impactLevelValue = document.getElementById('impactLevelValue');
    if (impactLevel && impactLevelValue) {
        impactLevel.addEventListener('input', (e) => {
            impactLevelValue.textContent = e.target.value;
        });
    }

    // 폼 제출 이벤트
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 폼 데이터 수집
            issueContext = collectFormData();
            
            // 데이터가 비어있는지 확인
            if (isFormEmpty(issueContext)) {
                // 모달 표시
                showModal();
                return;
            }
            
            // 챗봇 시작
            startChat();
        });
    }

    // 모달 "네" 버튼 - 데이터 없이 진행
    if (modalYesBtn) {
        modalYesBtn.addEventListener('click', () => {
            hideModal();
            startChat();
        });
    }

    // 모달 "아니오" 버튼 - 모달 닫기
    if (modalNoBtn) {
        modalNoBtn.addEventListener('click', () => {
            hideModal();
        });
    }

    // 모달 배경 클릭 시 닫기
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                hideModal();
            }
        });
    }

    // 메시지 전송 이벤트
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => sendMessage());
    }

    // Enter 키로 메시지 전송
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // 대화 종료 버튼
    if (endChatBtn) {
        endChatBtn.addEventListener('click', () => {
            if (confirm('대화를 종료하시겠습니까?')) {
                location.reload();
            }
        });
    }
});

// 폼 데이터 수집
function collectFormData() {
    const getCheckboxValues = (name) => {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
            .map(cb => cb.value);
    };

    return {
        situationSummary: document.getElementById('situationSummary')?.value || '',
        occurrenceTime: document.getElementById('occurrenceTime')?.value || '',
        impactLevel: document.getElementById('impactLevel')?.value || '',
        emotionReaction: getCheckboxValues('emotionReaction'),
        recentFeedback: document.getElementById('recentFeedback')?.value || '',
        stakeholderInfo: document.getElementById('stakeholderInfo')?.value || '',
        hiddenNeeds: document.getElementById('hiddenNeeds')?.value || '',
        leaderCauseView: document.getElementById('leaderCauseView')?.value || '',
        leaderSolutionDirection: document.getElementById('leaderSolutionDirection')?.value || '',
        solutionPriority: document.getElementById('solutionPriority')?.value || '',
        executionPeriod: document.getElementById('executionPeriod')?.value || '',
        leaderSupport: getCheckboxValues('leaderSupport'),
        leaderComment: document.getElementById('leaderComment')?.value || ''
    };
}

// 폼이 비어있는지 확인
function isFormEmpty(context) {
    // 주요 필드들이 모두 비어있는지 확인
    const isEmpty = !context.situationSummary && 
                   !context.occurrenceTime && 
                   !context.recentFeedback && 
                   !context.stakeholderInfo && 
                   !context.hiddenNeeds &&
                   !context.leaderCauseView &&
                   !context.leaderSolutionDirection &&
                   context.emotionReaction.length === 0 &&
                   context.leaderSupport.length === 0;
    
    return isEmpty;
}

// 모달 표시
function showModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// 모달 숨기기
function hideModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 챗봇 시작
async function startChat() {
    const chatInput = document.getElementById('chatInput');
    
    // 이슈 요약 표시
    displayIssueSummary(issueContext);
    
    // 폼 숨기고 챗봇 표시
    document.querySelector('#rolePlayingForm').parentElement.classList.add('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    
    // 기존 초기 메시지 제거
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 로딩 표시
    showLoading(true);
    
    try {
        // AI에게 초기 분석 요청
        const response = await fetch('/api/role-playing/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: '초기_분석_요청',
                issueContext: issueContext,
                chatHistory: [],
                isInitialAnalysis: true
            })
        });
        
        if (!response.ok) {
            throw new Error('서버 응답 오류');
        }
        
        const data = await response.json();
        
        // AI의 초기 분석 메시지 표시
        addMessageToChat('assistant', data.response);
        
        // 대화 히스토리 초기화
        chatHistory = [{
            role: 'assistant',
            content: data.response
        }];
        
    } catch (error) {
        console.error('Error:', error);
        // 에러 시 기본 메시지 표시
        const defaultMessage = '안녕하세요! Issue Navigator입니다. 어떤 부분에 대해 도움이 필요하신가요?';
        addMessageToChat('assistant', defaultMessage);
        chatHistory = [{
            role: 'assistant',
            content: defaultMessage
        }];
    } finally {
        showLoading(false);
    }
    
    // 채팅 입력창 포커스
    if (chatInput) {
        chatInput.focus();
    }
}

// 이슈 요약 표시
function displayIssueSummary(context) {
    const summaryContent = document.getElementById('summaryContent');
    if (!summaryContent) return;
    
    // 데이터가 비어있는 경우
    if (isFormEmpty(context)) {
        summaryContent.innerHTML = '<p class="mb-2 text-gray-500">입력된 이슈 정보가 없습니다. 일반적인 상담을 진행합니다.</p>';
        return;
    }
    
    let html = '';
    
    if (context.situationSummary) {
        html += `<p class="mb-2"><strong>상황:</strong> ${context.situationSummary}</p>`;
    }
    
    if (context.occurrenceTime || context.impactLevel) {
        html += `<p class="mb-2">`;
        if (context.occurrenceTime) {
            html += `<strong>발생 시기:</strong> ${context.occurrenceTime}`;
        }
        if (context.impactLevel) {
            html += ` | <strong>영향도:</strong> ${context.impactLevel}/5`;
        }
        html += `</p>`;
    }
    
    if (context.emotionReaction.length > 0) {
        html += `<p class="mb-2"><strong>감정 반응:</strong> ${context.emotionReaction.join(', ')}</p>`;
    }
    
    if (context.stakeholderInfo) {
        html += `<p class="mb-2"><strong>이해관계자 정보:</strong> ${context.stakeholderInfo.substring(0, 100)}${context.stakeholderInfo.length > 100 ? '...' : ''}</p>`;
    }
    
    if (!html) {
        html = '<p class="mb-2 text-gray-500">입력된 이슈 정보가 없습니다. 일반적인 상담을 진행합니다.</p>';
    }
    
    summaryContent.innerHTML = html;
}

// 메시지 전송
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput?.value.trim();
    
    if (!message) return;
    
    // 사용자 메시지 추가
    addMessageToChat('user', message);
    chatHistory.push({ role: 'user', content: message });
    
    // 입력창 초기화
    chatInput.value = '';
    
    // 로딩 표시
    showLoading(true);
    
    try {
        // AI 응답 요청
        const response = await fetch('/api/role-playing/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                issueContext: issueContext,
                chatHistory: chatHistory
            })
        });
        
        if (!response.ok) {
            throw new Error('서버 응답 오류');
        }
        
        const data = await response.json();
        
        // AI 응답 추가
        addMessageToChat('assistant', data.response);
        chatHistory.push({ role: 'assistant', content: data.response });
        
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('assistant', '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
        showLoading(false);
    }
    
    // 입력창 포커스
    if (chatInput) {
        chatInput.focus();
    }
}

// 채팅에 메시지 추가
function addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start mb-4 ${role === 'user' ? 'flex-row-reverse' : ''}`;
    
    if (role === 'assistant') {
        messageDiv.innerHTML = `
            <div class="flex-shrink-0 mr-3">
                <div class="apple-icon" style="background: linear-gradient(135deg, var(--light-blue) 0%, var(--deep-blue) 100%); color: white; width: 2.5rem; height: 2.5rem; font-size: 1rem;">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div class="flex-1">
                <div class="inline-block p-4 rounded-lg" style="background: white; border: 1px solid var(--apple-gray-300); max-width: 80%;">
                    <p class="apple-text" style="white-space: pre-wrap;">${escapeHtml(content)}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="flex-shrink-0 ml-3">
                <div class="apple-icon" style="background: var(--magenta); color: white; width: 2.5rem; height: 2.5rem; font-size: 1rem;">
                    <i class="fas fa-user"></i>
                </div>
            </div>
            <div class="flex-1 text-right">
                <div class="inline-block p-4 rounded-lg" style="background: var(--magenta); color: white; max-width: 80%;">
                    <p style="white-space: pre-wrap;">${escapeHtml(content)}</p>
                </div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 로딩 표시
function showLoading(show) {
    const loading = document.getElementById('chatLoading');
    const sendBtn = document.getElementById('sendMessageBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (show) {
        if (loading) loading.classList.remove('hidden');
        if (sendBtn) sendBtn.disabled = true;
        if (chatInput) chatInput.disabled = true;
    } else {
        if (loading) loading.classList.add('hidden');
        if (sendBtn) sendBtn.disabled = false;
        if (chatInput) chatInput.disabled = false;
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

