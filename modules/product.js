import PoolNamespace from "./pool.js";


const ProductNamespace = {
    Product: class {
        constructor(id, title, price) {
            this.id = id;
            this.title = title;
            this.price = price;
        }
    },

    async getInstanceById(productId) {
        const result = await PoolNamespace.pool.query(
            'SELECT * FROM products WHERE id = $1',
            [productId]
        );

        const productData = result.rows[0];
    
        let productInstance = new this.Product(productData.id, productData.title, productData.price);
        return productInstance;
    }
}

export default ProductNamespace;