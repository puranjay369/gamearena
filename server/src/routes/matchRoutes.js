import { Router } from 'express';
import {
  getMatchesForUser,
  persistClientFinishedMatch,
} from '../services/persistenceService.js';

const router = Router();

router.get('/matches', async (req, res) => {
  try {
    const uid = String(req.query.uid || '').trim();
    const limit = Number(req.query.limit || 50);

    if (!uid) {
      res.status(400).json({ ok: false, error: 'uid query parameter is required.' });
      return;
    }

    const matches = await getMatchesForUser(uid, limit);
    res.status(200).json({ ok: true, matches });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to load matches.' });
  }
});

router.post('/matches', async (req, res) => {
  try {
    const match = await persistClientFinishedMatch(req.body || {});
    if (!match) {
      res.status(400).json({ ok: false, error: 'Invalid or incomplete finished-match payload.' });
      return;
    }

    res.status(201).json({ ok: true, match });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to save match.' });
  }
});

export default router;
