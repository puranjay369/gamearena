import { Router } from 'express';
import {
  PRESET_AVATAR_IDS,
  getOrCreateUserProfile,
  updateUserAvatar,
} from '../services/persistenceService.js';

const router = Router();

router.get('/users/profile', async (req, res) => {
  try {
    const uid = String(req.query.uid || '').trim();
    const displayName = String(req.query.displayName || '').trim();

    if (!uid) {
      res.status(400).json({ ok: false, error: 'uid query parameter is required.' });
      return;
    }

    const user = await getOrCreateUserProfile({ uid, displayName });
    if (!user) {
      res.status(500).json({ ok: false, error: 'Failed to load user profile.' });
      return;
    }

    res.status(200).json({ ok: true, user });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to load user profile.' });
  }
});

router.patch('/users/avatar', async (req, res) => {
  try {
    const uid = String(req.body?.uid || '').trim();
    const avatarId = String(req.body?.avatarId || '').trim().toLowerCase();
    const displayName = String(req.body?.displayName || '').trim();

    if (!uid) {
      res.status(400).json({ ok: false, error: 'uid is required.' });
      return;
    }

    if (!PRESET_AVATAR_IDS.includes(avatarId)) {
      res.status(400).json({
        ok: false,
        error: `Invalid avatarId. Allowed values: ${PRESET_AVATAR_IDS.join(', ')}`,
      });
      return;
    }

    const user = await updateUserAvatar({ uid, avatarId, displayName });
    if (!user) {
      res.status(500).json({ ok: false, error: 'Failed to update avatar.' });
      return;
    }

    res.status(200).json({ ok: true, user });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to update avatar.' });
  }
});

export default router;
