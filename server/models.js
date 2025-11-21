const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;
const dbUrl = process.env.DATABASE_URL;

if (dbUrl && dbUrl.startsWith('postgres')) {
    sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    });
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, 'database.sqlite'),
        logging: false
    });
}

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true }, 
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verification_status: { type: DataTypes.STRING, defaultValue: 'UNVERIFIED' },
  mobile_number: { type: DataTypes.STRING },
  selfie_url: { type: DataTypes.STRING },
  id_proof_url: { type: DataTypes.STRING },
  rating_sum: { type: DataTypes.FLOAT, defaultValue: 0 },
  rating_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  avg_rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  avg_response_minutes: { type: DataTypes.INTEGER, defaultValue: 60 },
  wallet_balance: { type: DataTypes.INTEGER, defaultValue: 500000 },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Item = sequelize.define('Item', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  part_number: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING }, 
  subcategory: { type: DataTypes.STRING },
  listing_type: { type: DataTypes.STRING, defaultValue: 'RENT' },
  price_day: { type: DataTypes.INTEGER, allowNull: false }, 
  price_week: { type: DataTypes.INTEGER },
  price_month: { type: DataTypes.INTEGER },
  location: { type: DataTypes.STRING, allowNull: false },
  image_url: { type: DataTypes.STRING },
});

const Order = sequelize.define('Order', {
  status: { type: DataTypes.STRING, defaultValue: 'PENDING_APPROVAL' }, 
  total_amount: { type: DataTypes.INTEGER }, 
  platform_fee: { type: DataTypes.INTEGER }, 
  owner_amount: { type: DataTypes.INTEGER }, 
  start_date: { type: DataTypes.DATEONLY }, 
  duration_days: { type: DataTypes.INTEGER },
  project_details: { type: DataTypes.JSON }, 
  buyer_details: { type: DataTypes.JSON },
  buyer_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  seller_confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_reviewed: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Chat = sequelize.define('Chat', { last_message: DataTypes.TEXT, last_message_at: DataTypes.DATE });
const Message = sequelize.define('Message', { content: DataTypes.TEXT, is_read: { type: DataTypes.BOOLEAN, defaultValue: false } });
const Transaction = sequelize.define('Transaction', { type: DataTypes.STRING, amount: DataTypes.INTEGER, description: DataTypes.STRING });
const Review = sequelize.define('Review', { rating: DataTypes.INTEGER, comment: DataTypes.TEXT });

User.hasMany(Item); Item.belongsTo(User);
User.hasMany(Order, { as: 'OrdersBought', foreignKey: 'BuyerId' });
User.hasMany(Order, { as: 'OrdersSold', foreignKey: 'SellerId' });
Order.belongsTo(User, { as: 'Buyer', foreignKey: 'BuyerId' });
Order.belongsTo(User, { as: 'Seller', foreignKey: 'SellerId' });
Item.hasMany(Order); Order.belongsTo(Item);

Chat.belongsTo(User, { as: 'User1', foreignKey: 'User1Id' });
Chat.belongsTo(User, { as: 'User2', foreignKey: 'User2Id' });
Chat.belongsTo(Item); Chat.hasMany(Message); Message.belongsTo(Chat); Message.belongsTo(User, { as: 'Sender' });

User.hasMany(Transaction); Transaction.belongsTo(User);
Order.hasOne(Review); Review.belongsTo(Order); Review.belongsTo(User, { as: 'TargetUser', foreignKey: 'TargetUserId' });

module.exports = { sequelize, User, Item, Order, Chat, Message, Transaction, Review };