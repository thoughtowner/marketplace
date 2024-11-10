import pg from 'pg';

const { Pool } = pg;
const pool = new Pool(
    {
        'user': 'postgres',
        'host': 'localhost',
        'database': 'marketplace-test-db',
        'password': 'postgres',
        'port': 7961,
    }
);

const PoolNamespace = {
    pool: pool
};

export default PoolNamespace;