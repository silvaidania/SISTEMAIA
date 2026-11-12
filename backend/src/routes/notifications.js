import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../services/notifications.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    const notifications = await getUserNotifications(req.user.userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 50
    });
    return res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await getUnreadCount(req.user.userId);
    return res.json({ count });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.userId);
    return res.json({ notification });
  } catch (error) {
    next(error);
  }
});

router.post('/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    const notifications = await markAllAsRead(req.user.userId);
    return res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

export default router;
