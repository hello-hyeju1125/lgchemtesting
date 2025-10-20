import express from 'express';
const router = express.Router();

// 조직 현황 데이터 저장소 (실제 환경에서는 데이터베이스 사용)
let teamStatusData = null;

/**
 * 조직 현황 데이터 저장
 * POST /api/team-status
 */
router.post('/', async (req, res) => {
    try {
        const {
            team_name,
            team_size,
            team_role,
            team_age,
            location,
            workload_level,
            collaboration_score,
            goal_alignment,
            engagement_level,
            feedback_frequency,
            team_challenge,
            leader_goal,
            ai_support_expectation,
            comment,
            updated_at
        } = req.body;

        // 데이터 검증
        if (!team_name || !team_size || !team_role) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다. (조직명, 조직원 수, 조직 성격)'
            });
        }

        // 조직 현황 데이터 구성
        const teamStatus = {
            team_name,
            team_size: parseInt(team_size),
            team_role,
            team_age: team_age || '',
            location: location || '',
            workload_level: parseInt(workload_level) || 3,
            collaboration_score: parseInt(collaboration_score) || 3,
            goal_alignment: goal_alignment || '',
            engagement_level: parseInt(engagement_level) || 3,
            feedback_frequency: feedback_frequency || '',
            team_challenge: team_challenge || '',
            leader_goal: leader_goal || '',
            ai_support_expectation: Array.isArray(ai_support_expectation) ? ai_support_expectation : [],
            comment: comment || '',
            updated_at: updated_at || new Date().toISOString(),
            created_at: teamStatusData ? teamStatusData.created_at : new Date().toISOString()
        };

        // 데이터 저장
        teamStatusData = teamStatus;

        console.log('조직 현황 데이터 저장됨:', teamStatus);

        res.json({
            success: true,
            message: '조직 현황이 성공적으로 저장되었습니다.',
            data: teamStatus
        });

    } catch (error) {
        console.error('조직 현황 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 조직 현황 데이터 조회
 * GET /api/team-status
 */
router.get('/', async (req, res) => {
    try {
        if (!teamStatusData) {
            return res.status(404).json({
                success: false,
                message: '저장된 조직 현황 데이터가 없습니다.'
            });
        }

        res.json({
            success: true,
            data: teamStatusData
        });

    } catch (error) {
        console.error('조직 현황 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * 조직 현황 데이터 삭제
 * DELETE /api/team-status
 */
router.delete('/', async (req, res) => {
    try {
        teamStatusData = null;

        res.json({
            success: true,
            message: '조직 현황 데이터가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('조직 현황 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;
