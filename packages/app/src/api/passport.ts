import passport from 'passport';
import { Strategy } from 'passport-local';
import { AUTH } from '../config';

export const setupPassportAuth = () => {
  passport.use(new Strategy((username, password, cb) => {
    if (username === AUTH.username && password === AUTH.password) {
      cb(null, { user: AUTH.username });
      return;
    }
    cb(null, false);
  }));

  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });
};
