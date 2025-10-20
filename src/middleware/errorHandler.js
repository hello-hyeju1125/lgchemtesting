/**
 * 전역 에러 핸들러 미들웨어
 */

export const errorHandler = (err, req, res, next) => {
  console.error('❌ 에러 발생:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // OpenAI API 에러 처리
  if (err.message && err.message.includes('OpenAI')) {
    return res.status(503).json({
      success: false,
      error: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      code: 'AI_SERVICE_ERROR'
    });
  }

  // 유효성 검사 에러
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '입력 데이터가 올바르지 않습니다.',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // 인증 에러
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다.',
      code: 'UNAUTHORIZED'
    });
  }

  // 권한 에러
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: '접근 권한이 없습니다.',
      code: 'FORBIDDEN'
    });
  }

  // 리소스 없음 에러
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: '요청한 리소스를 찾을 수 없습니다.',
      code: 'NOT_FOUND'
    });
  }

  // 기본 서버 에러
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다.';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 에러 핸들러
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `요청한 경로를 찾을 수 없습니다: ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
};

/**
 * 비동기 에러 래퍼
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
