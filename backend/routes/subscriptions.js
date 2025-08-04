import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect, admin, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/subscriptions/plans
// @desc    Get available subscription plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Trial',
        price: 0,
        currency: 'USD',
        period: '1 day',
        features: [
          'Access to basic dashboard',
          'Limited analytics',
          '1 day trial period',
          'Standard support',
        ],
        recommended: false
      },
      {
        id: 'monthly',
        name: 'Monthly Plan',
        price: 19.99,
        currency: 'USD',
        period: 'month',
        features: [
          'Full dashboard access',
          'Advanced analytics',
          'Amazon Checker access',
          'Priority support',
          'Data export',
          'API access',
        ],
        recommended: true
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subscriptions/upgrade
// @desc    Upgrade user subscription
// @access  Private
router.post('/upgrade', protect, [
  body('planId')
    .isIn(['free', 'monthly'])
    .withMessage('Plan ID must be free or monthly'),
  body('paymentMethod')
    .optional()
    .isString()
    .withMessage('Payment method must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { planId, paymentMethod } = req.body;

    // In a real app, you would integrate with a payment processor here
    // For now, we'll simulate a successful payment

    // Calculate expiry date
    let expiryDate = null;
    if (planId === 'free') {
      // Free trial: 1 day
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
    } else if (planId === 'monthly') {
      // Monthly plan: 1 month
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // Update user subscription
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscriptionStatus: planId,
        subscriptionExpiry: expiryDate
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Subscription upgraded successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subscriptions/status
// @desc    Get user subscription status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Check if subscription has expired
    let isExpired = false;
    if (user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
      isExpired = true;
      // Auto-downgrade to free if expired
      if (user.subscriptionStatus !== 'free') {
        await User.findByIdAndUpdate(req.user._id, {
          subscriptionStatus: 'free',
          subscriptionExpiry: null
        });
        user.subscriptionStatus = 'free';
        user.subscriptionExpiry = null;
      }
    }

    res.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      isExpired,
      daysUntilExpiry: user.subscriptionExpiry 
        ? Math.ceil((new Date(user.subscriptionExpiry) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel user subscription
// @access  Private
router.post('/cancel', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        subscriptionStatus: 'free',
        subscriptionExpiry: null
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Subscription cancelled successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subscriptions/stats (Admin only)
// @desc    Get subscription statistics
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$subscriptionStatus',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$subscriptionStatus', 'monthly'] }, then: 19.99 }
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await User.countDocuments({
      subscriptionStatus: { $in: ['monthly'] }
    });

    const monthlyRevenue = stats.reduce((total, stat) => {
      return total + (stat.totalRevenue || 0);
    }, 0);

    res.json({
      stats,
      totalUsers,
      activeSubscriptions,
      monthlyRevenue,
      conversionRate: totalUsers > 0 ? (activeSubscriptions / totalUsers * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/subscriptions/:userId (Admin only)
// @desc    Update user subscription by admin
// @access  Private/Admin
router.put('/:userId', protect, admin, [
  body('subscriptionStatus')
    .isIn(['free', 'monthly'])
    .withMessage('Subscription status must be free or monthly'),
  body('subscriptionExpiry')
    .optional()
    .isISO8601()
    .withMessage('Subscription expiry must be a valid date')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { subscriptionStatus, subscriptionExpiry } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        subscriptionStatus,
        subscriptionExpiry: subscriptionExpiry || null
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Subscription updated successfully',
      user
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 