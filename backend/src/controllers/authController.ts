import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { APIResponse, AuthResponse, User, RegisterRequest, LoginRequest, RequestWithUser } from '../types';

const authService = new AuthService();

export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=])[A-Za-z\d@$!%*?&#+\-_=]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName').optional().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validatePasswordReset = [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Please provide a valid email'),
];

export const register = async (
  req: Request<{}, APIResponse<{ user: User }>, RegisterRequest>,
  res: Response<APIResponse<{ user: User }>>
): Promise<Response<APIResponse<{ user: User }>> | void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0]?.msg || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          message: error.message,
          code: 'USER_EXISTS',
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed',
        code: 'REGISTRATION_ERROR',
      },
    });
  }
};

export const login = async (
  req: Request<{}, APIResponse<AuthResponse>, LoginRequest>,
  res: Response<APIResponse<AuthResponse>>
): Promise<Response<APIResponse<AuthResponse>> | void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0]?.msg || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      },
    });
  }
};

export const refresh = async (
  req: Request<{}, APIResponse<{ tokens: any }>, { refreshToken: string }>,
  res: Response<APIResponse<{ tokens: any }>>
): Promise<Response<APIResponse<{ tokens: any }>> | void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
          code: 'TOKEN_REQUIRED',
        },
      });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: { tokens },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
        code: 'INVALID_TOKEN',
      },
    });
  }
};

export const logout = async (
  req: Request<{}, APIResponse<null>, { refreshToken?: string }>,
  res: Response<APIResponse<null>>
) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Logout successful',
    });
  }
};

export const getProfile = async (
  req: RequestWithUser,
  res: Response<APIResponse<{ user: User }>>
): Promise<Response<APIResponse<{ user: User }>> | void> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      });
    }

    res.json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile',
        code: 'PROFILE_ERROR',
      },
    });
  }
};

export const requestPasswordReset = async (
  req: Request<{}, APIResponse<null>, { email: string }>,
  res: Response<APIResponse<null>>
): Promise<Response<APIResponse<null>> | void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: errors.array()[0]?.msg || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array(),
        },
      });
    }

    await authService.requestPasswordReset(req.body.email);

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process password reset request',
        code: 'PASSWORD_RESET_ERROR',
      },
    });
  }
};