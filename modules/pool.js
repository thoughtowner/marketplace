import pg from 'pg';

const PoolNamespace = {
    getPool() {
        const { Pool } = pg;

        const pool = new Pool(
            {
                'user': 'postgres',
                'host': 'localhost',
                'database': '',
                'password': 'postgres',
                'port': 7960,
            }
        );
        return pool;
    },

    getTestPool() {
        const { Pool } = pg;
        
        const testPool = new Pool(
            {
                'user': 'postgres',
                'host': 'localhost',
                'database': 'marketplace-test-db',
                'password': 'postgres',
                'port': 7961,
            }
        );
        return testPool;
    }
}

export default PoolNamespace;