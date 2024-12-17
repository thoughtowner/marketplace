const PoolNamespace = require('./pool.js');


const ProductNamespace = {
    Product: class {
        constructor(id, title, price, photo) {
            this.id = id;
            this.title = title;
            this.price = price;
            this.photo = photo;
        }
    },

    async getInstanceById(productId) {
        const result = await PoolNamespace.pool.query(
            'SELECT * FROM products WHERE id = $1',
            [productId]
        );

        if (result.rows.length === 0) {
            throw new Error(`В таблице products нет записей с id "${productId}"`);
        }

        const productData = result.rows[0];
    
        let productInstance = new this.Product(productData.id, productData.title, productData.price, productData.photo);
        return productInstance;
    }
}

module.exports = ProductNamespace;
