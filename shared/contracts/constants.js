/**
 * Shared System Constants for CollabCode
 */

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
};

export const TEMPLATES = {
  BLANK: 'blank',
  JAVASCRIPT: 'javascript',
  HTML_CSS_JS: 'html-css-js'
};

export const FILE_TYPES = {
  FILE: 'file',
  FOLDER: 'folder'
};

export const COMMENT_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved'
};

export const EXECUTION_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMED_OUT: 'timed_out',
  CANCELLED: 'cancelled'
};

export const SUPPORTED_LANGUAGES = [
  'javascript',
  'python',
  'typescript',
  'html',
  'css',
  'json',
  'markdown'
];

export const PRESENCE_STATUS = {
  ACTIVE: 'active',
  IDLE: 'idle'
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

export default {
  ROLES,
  TEMPLATES,
  FILE_TYPES,
  COMMENT_STATUS,
  EXECUTION_STATUS,
  SUPPORTED_LANGUAGES,
  PRESENCE_STATUS,
  ERROR_CODES
};
