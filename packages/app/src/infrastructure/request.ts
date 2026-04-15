import axios from 'axios';

export const request = axios.create({
  timeout: 600000 // 10 minutes — prevents stuck workers when WordPress hangs
});
