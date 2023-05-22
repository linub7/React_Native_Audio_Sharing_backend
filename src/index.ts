import express from 'express';
import 'dotenv/config';
import './db';
import authRoutes from './routes/auth';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log('Port is listening on port ' + PORT);
});
