const ShopNamespace = {
    Shop: class {
        constructor(producer, title) {
            this.producer = producer;
            this.title = title;
            this.catalog = [];
        }
    }
}

export default ShopNamespace;