import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/models/product.model.js';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/begget');
    console.log('Connected to MongoDB');
    
    // Check if there are any products
    const products = await Product.find().limit(2);
    console.log('Existing products:', products);
    
    // If no products, create some sample products
    if (products.length === 0) {
      console.log('No products found. Creating sample products...');
      
      // Create sample products
      const sampleProducts = [
        {
          _id: '64f8ac913d5d9b9b9c8e0001',
          title: 'Sample T-Shirt',
          description: 'A comfortable cotton t-shirt',
          category: 'Clothing',
          variants: [
            {
              sku: 'SKU123',
              price: 599,
              stock: 100,
              attributes: { size: 'M', color: 'Blue' }
            }
          ],
          gstRate: 5
        },
        {
          _id: '64f8ac913d5d9b9b9c8e0002',
          title: 'Sample Jeans',
          description: 'Stylish denim jeans',
          category: 'Clothing',
          variants: [
            {
              sku: 'SKU456',
              price: 799,
              stock: 50,
              attributes: { size: '32', color: 'Black' }
            }
          ],
          gstRate: 5
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('Sample products created successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();