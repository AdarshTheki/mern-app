import { Notification } from '../models/notification.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
// ─────────────────────────────────────────────
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ userId: req.user._id }),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        unreadCount,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        notifications,
      },
      'Notifications fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// ─────────────────────────────────────────────
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to update this notification'
    );
  }

  if (notification.isRead) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          notification,
          'Notification already marked as read'
        )
      );
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return res
    .status(200)
    .json(new ApiResponse(200, notification, 'Notification marked as read'));
});

// ─────────────────────────────────────────────
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
// ─────────────────────────────────────────────
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedCount: result.modifiedCount },
        'All notifications marked as read'
      )
    );
});

// ─────────────────────────────────────────────
// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');

  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to delete this notification'
    );
  }

  await notification.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Notification deleted successfully'));
});

export {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
