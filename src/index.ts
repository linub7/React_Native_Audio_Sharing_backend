import express from 'express';
import 'dotenv/config';
import './db';
import authRoutes from './routes/auth';
import audioRoutes from './routes/audio';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('src/public'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/audios', audioRoutes);

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log('Port is listening on port ' + PORT);
});
