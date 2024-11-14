import PoolNamespace from "./pool.js";


const ShopNamespace = {
    Shop: class {
        constructor(id, title, catalog=null) {
            this.id = id;
            this.title = title;
            this.catalog = catalog || [];
        }

        async updateCatalogInDB_2() {
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

            // for (let i = 0; i < this.catalog.length; i++) {
            //     if (this.catalog[i]['totalQuantity'] === 0) {
            //         deleteResult = await PoolNamespace.pool.query(
            //             `
            //                 DELETE FROM shop_to_product
            //                 WHERE
            //                     shop_id = $1 AND
            //                     product_id = $2
            //             `,
            //             [this.id, this.catalog[i]['productId']]
            //         );
            //         // this.catalog.splice(i, 1);
            //     }
            // }
        }

        async updateCatalogInDB() {
            let selectResult;
            let selectData;
            let result;

            for (let i = 0; i < this.catalog.length; i++) {
                selectResult = await PoolNamespace.pool.query(
                    `
                        SELECT * FROM shop_to_product
                        WHERE
                            shop_id = $1 AND
                            product_id = $2
                    `,
                    [this.id, this.catalog[i]['productId']]
                );

                if (selectResult.rows.length > 0) {
                    selectData = selectResult.rows[0];
                    result = await PoolNamespace.pool.query(
                        `
                            UPDATE shop_to_product
                            SET
                                total_quantity = $1,
                                quantity_in_carts = $2
                            WHERE
                                shop_id = $3 AND
                                product_id = $4
                        `,
                        [this.catalog[i]['totalQuantity'], this.catalog[i]['quantityInCarts'], this.id, this.catalog[i]['productId']]
                    );
                } else {
                    result = await PoolNamespace.pool.query(
                        `
                            INSERT INTO shop_to_product (shop_id, product_id, total_quantity, quantity_in_carts) 
                            VALUES ($1, $2, $3, $4);
                        `,
                        [this.id, this.catalog[i]['productId'], this.catalog[i]['totalQuantity'], this.catalog[i]['quantityInCarts']]
                    );
                }
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