import express from 'express';
import 'dotenv/config';
import './db';
import authRoutes from './routes/auth';
import audioRoutes from './routes/audio';
import favoriteRoutes from './routes/favorite';
import playlistRoutes from './routes/playlist';
import profileRoutes from './routes/profile';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('src/public'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/audios', audioRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/playlists', playlistRoutes);

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log('Port is listening on port ' + PORT);
});
