import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import userRoutes from './routes/user.routes';
import reimbursementRoutes from './routes/reimbursement.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/users', userRoutes);
app.use('/reimbursements', reimbursementRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'OK' });
});

export default app;
