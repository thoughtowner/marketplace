import PoolNamespace from "./pool.js";


const ShopNamespace = {
    Shop: class {
        constructor(id, title, catalog=null) {
            this.id = id;
            this.title = title;
            this.catalog = catalog || [];
        }

        async updateCatalogInDB() {
            let deleteResult;
            let insertResult;

            for (let i = 0; i < this.catalog.length; i++) {
                deleteResult = await PoolNamespace.pool.query(
                    `
                        DELETE FROM shop_to_product
                        WHERE
                            shop_id = $1 AND
                            product_id = $2
                    `,
                    [this.id, this.catalog[i]['productId']]
                );
            }

            for (let i = 0; i < this.catalog.length; i++) {
                insertResult = await PoolNamespace.pool.query(
                    `
                        INSERT INTO shop_to_product (shop_id, product_id, total_quantity, quantity_in_carts)
                        VALUES ($1, $2, $3, $4);
                    `,
                    [this.id, this.catalog[i]['productId'], this.catalog[i]['totalQuantity'], this.catalog[i]['quantityInCarts']]
                );
            }
        }

        async deleteProductFromCatalogInDB(i) {
            let deleteResult;
            let insertResult;
            
            for (let i = 0; i < this.catalog.length; i++) {
                deleteResult = await PoolNamespace.pool.query(
                    `
                        DELETE FROM shop_to_product
                        WHERE
                            shop_id = $1 AND
                            product_id = $2
                    `,
                    [this.id, this.catalog[i]['productId']]
                );
            }

            this.catalog.splice(i, 1);

            for (let i = 0; i < this.catalog.length; i++) {
                insertResult = await PoolNamespace.pool.query(
                    `
                        INSERT INTO shop_to_product (shop_id, product_id, total_quantity, quantity_in_carts)
                        VALUES ($1, $2, $3, $4);
                    `,
                    [this.id, this.catalog[i]['productId'], this.catalog[i]['totalQuantity'], this.catalog[i]['quantityInCarts']]
                );
            }
        }
    },

    async getInstanceById(shopId) {
        const baseResult = await PoolNamespace.pool.query(
            'SELECT * FROM shops WHERE id = $1',
            [shopId]
        );

        if (baseResult.rows.length === 0) {
            throw new Error(`В таблице shops нет записей с id "${shopId}"`);
        }

        const catalogResults = await PoolNamespace.pool.query(
            `
                SELECT 
                    s.id AS shop_id,
                    sp.product_id,
                    sp.total_quantity,
                    sp.quantity_in_carts
                FROM 
                    shops s
                LEFT JOIN 
                    shop_to_product sp ON s.id = sp.shop_id
                WHERE 
                    s.id = $1
            `,
            [shopId]
        );

        let catalog = [];
        catalogResults.rows.forEach(row => {
            if (row.product_id !== null && row.total_quantity !== null && row.quantity_in_carts !== null) {
                catalog.push({
                    productId: row.product_id,
                    totalQuantity: row.total_quantity,
                    quantityInCarts: row.quantity_in_carts
                });
            }
        });

        const result = {
            ...baseResult.rows[0],
            catalog: Object.values(catalog)
        };
    
        let shopInstance = new this.Shop(result.id, result.title, result.catalog);
        return shopInstance;
    }
}

export default ShopNamespace;