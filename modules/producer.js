import ShopNamespace from "./shop.js";


const ProducerNamespace = {
    name: null,
    money: null,
    shop: null,

    transferMoneyToUser(user, money) {
        if (money <= this.money) {
            this.money -= money;
            user.money += money;
            console.log(`Продавец ${this.name} перевёл ${money} рублей пользователю ${user.username}.`);
        } else {
            throw new Error(`Продавец ${this.name} не может перевести ${money} рублей пользователю ${user.username}, так как количество денег у продавца меньше, чем он хотел бы перевести.`);
        }
    },

    createShop(name) {
        if (!this.shop) {
            this.shop = ShopNamespace.Shop(name);
        } else {
            throw new Error(`Продавец ${this.name} не может создать новый магазин, так как у продавца магазин уже существует.`);
        }
    }
};

export default ProducerNamespace;