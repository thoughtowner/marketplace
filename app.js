import express from 'express';
import pg from 'pg';
import cors from 'cors';
import ConsumerNamespace from './modules/consumer';
import ShopNamespace from './modules/shop';


const { Pool } = pg;
const pool = new Pool(
    {
        'user': a,
        'host': a,
        'database': a,
        'password': a,
        'port': a,
    }
);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());