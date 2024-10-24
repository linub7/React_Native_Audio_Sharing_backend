import express from 'express';
import morgan from 'morgan';
import 'dotenv/config';
import 'express-async-errors';
import './db';

import authRoutes from './routes/auth';
import audioRoutes from './routes/audio';
import favoriteRoutes from './routes/favorite';
import playlistRoutes from './routes/playlist';
import profileRoutes from './routes/profile';
import historyRoutes from './routes/history';
import './utils/schedule';
import { errorHandler } from './middlewares/error';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('src/public'));
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/audios', audioRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/playlists', playlistRoutes);

app.use('/', (req, res) => {
  res.json({ message: 'OK' });
});

app.get('*', (req, res) => {
  // Handle default route
  res.send('Hello from your Express.js app!');
});

app.use(errorHandler);

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log('Port is listening on port ' + PORT);
});
