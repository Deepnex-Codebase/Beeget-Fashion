/**
 * Test file to check ShipRocket integration
 * Run this file with: node test-shipping.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Test functions
const testShippingConnection = async () => {
  try {
    console.log('\n🔍 Testing ShipRocket connection...');
    const response = await axios.get(`${BASE_URL}/shipping/test-connection`);
    
    if (response.data.success) {
      console.log('✅ ShipRocket connection successful!');
      console.log('📧 Email:', response.data.data.email);
      console.log('🆔 Channel ID:', response.data.data.channelId);
      console.log('🔐 Authenticated:', response.data.data.authenticated);
    } else {
      console.log('❌ ShipRocket connection failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error testing connection:', error.response?.data || error.message);
  }
};

const testPickupLocations = async () => {
  try {
    console.log('\n📍 Testing pickup locations...');
    const response = await axios.get(`${BASE_URL}/shipping/pickup-locations`);
    
    if (response.data.success) {
      console.log('✅ Pickup locations fetched successfully!');
      console.log('📦 Number of pickup locations:', response.data.data?.data?.length || 0);
      
      if (response.data.data?.data?.length > 0) {
        const firstLocation = response.data.data.data[0];
        console.log('🏢 First location:', firstLocation.pickup_location);
        console.log('📍 Address:', firstLocation.address);
      }
    } else {
      console.log('❌ Failed to fetch pickup locations:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error fetching pickup locations:', error.response?.data || error.message);
  }
};

const testCourierServiceability = async () => {
  try {
    console.log('\n🚚 Testing courier serviceability...');
    const testData = {
      pickupPostcode: '110001', // Delhi
      deliveryPostcode: '400001', // Mumbai
      weight: 1, // 1 kg
      cod: 0 // No COD
    };
    
    const response = await axios.post(`${BASE_URL}/shipping/check-serviceability`, testData);
    
    if (response.data.success) {
      console.log('✅ Courier serviceability check successful!');
      console.log('🚛 Available couriers:', response.data.data?.data?.available_courier_companies?.length || 0);
      
      if (response.data.data?.data?.available_courier_companies?.length > 0) {
        const firstCourier = response.data.data.data.available_courier_companies[0];
        console.log('📦 First courier:', firstCourier.courier_name);
        console.log('💰 Rate:', firstCourier.rate);
        console.log('⏱️ Expected delivery:', firstCourier.etd);
      }
    } else {
      console.log('❌ Courier serviceability check failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Error checking serviceability:', error.response?.data || error.message);
  }
};

const runAllTests = async () => {
  console.log('🚀 Starting ShipRocket Integration Tests...');
  console.log('=' .repeat(50));
  
  await testShippingConnection();
  await testPickupLocations();
  await testCourierServiceability();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ All tests completed!');
  console.log('\n📝 How to test manually:');
  console.log('1. Test connection: GET http://localhost:8000/api/shipping/test-connection');
  console.log('2. Get pickup locations: GET http://localhost:8000/api/shipping/pickup-locations');
  console.log('3. Check serviceability: POST http://localhost:8000/api/shipping/check-serviceability');
  console.log('   Body: {"pickupPostcode":"110001","deliveryPostcode":"400001","weight":1}');
  console.log('\n🔧 You can also test these endpoints using Postman or any API testing tool.');
};

// Run tests
runAllTests().catch(console.error);