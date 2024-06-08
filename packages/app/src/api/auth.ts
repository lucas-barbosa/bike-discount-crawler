import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/admin/login', (req, res, next) => {
  res.render('login');
});

router.post('/admin/login/password', passport.authenticate('local', {
  successRedirect: '/admin/queues',
  failureRedirect: '/admin/login'
}));

export default router;
