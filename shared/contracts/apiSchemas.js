/**
 * API Contract Schemas and Response Helpers
 */

import { ERROR_CODES, ROLES, TEMPLATES, FILE_TYPES } from './constants.js';

/**
 * Standard Success Envelope
 */
export function createSuccessResponse(data = {}, meta = null) {
  return {
    success: true,
    data,
    meta
  };
}

/**
 * Standard Error Envelope
 */
export function createErrorResponse(code, message, details = [], requestId = null) {
  return {
    success: false,
    error: {
      code: code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: message || 'An unexpected error occurred.',
      details: Array.isArray(details) ? details : [],
      requestId: requestId || `req_${Date.now()}`
    }
  };
}

/**
 * Basic In-Memory Validation Helpers
 */
export function validateRegistration(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long.' });
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push({ field: 'email', message: 'Valid email is required.' });
  }
  if (!body.password || body.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long.' });
  }
  if (body.password !== body.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords must match.' });
  }
  return errors;
}

export function validateLogin(body) {
  const errors = [];
  if (!body.email) {
    errors.push({ field: 'email', message: 'Email is required.' });
  }
  if (!body.password) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }
  return errors;
}

export function validateWorkspaceCreate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Workspace name is required.' });
  }
  if (body.template && !Object.values(TEMPLATES).includes(body.template)) {
    errors.push({ field: 'template', message: `Template must be one of: ${Object.values(TEMPLATES).join(', ')}` });
  }
  return errors;
}

export function validateFileCreate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'File name is required.' });
  }
  if (!body.type || !Object.values(FILE_TYPES).includes(body.type)) {
    errors.push({ field: 'type', message: `Type must be one of: ${Object.values(FILE_TYPES).join(', ')}` });
  }
  return errors;
}

export default {
  createSuccessResponse,
  createErrorResponse,
  validateRegistration,
  validateLogin,
  validateWorkspaceCreate,
  validateFileCreate
};
