import express from 'express';
import 'dotenv/config';
import './db';
import authRoutes from './routes/auth';
import audioRoutes from './routes/audio';
import favoriteRoutes from './routes/favorite';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('src/public'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/audios', audioRoutes);
app.use('/api/v1/favorites', favoriteRoutes);

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log('Port is listening on port ' + PORT);
});
